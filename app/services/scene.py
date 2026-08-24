"""
ProstudioX — Scene beat breakdown.

Splits a narration script into shot-length beats, each with an estimated
spoken duration and an English stock-footage search keyword. Uses the
configured LLM provider when available, and falls back to a deterministic
sentence-split heuristic otherwise, so the API always returns a usable list.

Design note: this is the "Scenes" step of the ProstudioX wizard. The returned
beats map 1:1 onto per-scene footage keywords; each beat also carries a
``media_type`` ("video" or "image") so combined sourcing can alternate between
short video clips and still photos (ken-burns) for a "speech ad" feel.
"""

import json
import re
from typing import List, Optional

from loguru import logger

from app.utils import utils

_max_retries = 3
_WORDS_PER_SECOND = 2.4

# Accepted per-beat media types. Anything else normalizes to "video".
_MEDIA_TYPES = ("video", "image")

DEFAULT_SCENE_SYSTEM_PROMPT = """\
# Role: Short-Video Scene Breakdown

## Goals:
Split the provided narration script into a sequence of shot-length scenes.

## Constraints:
1. Respond ONLY with a single valid JSON array. No markdown, no code fences, no commentary.
2. Each item must be an object with exactly these keys: "beat", "duration", "keywords", "media_type".
3. "beat": the exact narration text for that scene (a short, speakable sentence or two).
4. "duration": the estimated spoken duration in seconds (number).
5. "keywords": a short English stock-video search term (1-4 words) that matches the scene.
6. "media_type": one of "video" or "image", per the media_style instruction.
7. Keep the total number of scenes reasonable for the target duration.
"""


def _strip_code_fence(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z0-9]*\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def _parse_scenes(response: str) -> List[dict]:
    data = None
    try:
        data = json.loads(_strip_code_fence(response))
    except Exception:
        match = re.search(r"\[.*\]", response or "", re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
            except Exception:
                data = None
    if not isinstance(data, list):
        raise ValueError("scene response is not a JSON array")

    scenes: List[dict] = []
    for i, item in enumerate(data, 1):
        if not isinstance(item, dict):
            continue
        beat = str(item.get("beat", "")).strip()
        if not beat:
            continue
        try:
            duration = float(item.get("duration", 5.0))
        except (TypeError, ValueError):
            duration = 5.0
        keywords = str(item.get("keywords", "")).strip()
        media_type = _normalize_media_type(item.get("media_type"))
        scenes.append(
            {
                "index": i,
                "beat": beat,
                "duration": round(max(1.0, duration), 1),
                "keywords": keywords,
                "source": "pexels",
                "media_type": media_type,
            }
        )
    if not scenes:
        raise ValueError("scene response contained no usable beats")
    return scenes


def _normalize_media_type(value) -> str:
    """Coerce an LLM/JSON media_type value into 'video' or 'image'."""
    value = str(value or "").strip().lower()
    return value if value in _MEDIA_TYPES else "video"


def build_scene_prompt(
    video_script: str,
    video_subject: str = "",
    target_duration: int = 30,
    language: str = "",
    media_style: str = "combined",
) -> str:
    prompt = DEFAULT_SCENE_SYSTEM_PROMPT
    prompt += f"""

# Initialization:
- target total duration: about {target_duration} seconds
- media_style: {media_style}
"""
    if language:
        prompt += f"- narration language: {language}\n"
    if video_subject:
        prompt += f"- video subject: {video_subject}\n"
    prompt += """
- media_style controls each scene's "media_type":
  * "video"  -> every scene uses "video" (motion stock clips).
  * "image"  -> every scene uses "image" (still photos, ken-burns zoom).
  * "combined"-> alternate: use "video" for action/motion beats and "image" for
    emotional, punchline or hook beats, so the video reads like a dramatic
    "speech ad" with ~3s clips interleaved with still shots.
"""
    prompt += f"""
# Narration script to break down:
{video_script}
"""
    return prompt


def _heuristic_keywords(sentence: str) -> str:
    """Fallback search term: the first meaningful English words in the beat."""
    words = re.findall(r"[A-Za-z]{3,}", sentence or "")
    if not words:
        return "abstract background"
    return " ".join(words[:3]).lower()


def _fallback_scenes(
    video_script: str,
    target_duration: int = 30,
    media_style: str = "combined",
) -> List[dict]:
    """Deterministic split used when the LLM is unavailable or misbehaves."""
    sentences = [
        s for s in utils.split_string_by_punctuations(video_script or "") if s.strip()
    ]
    if not sentences:
        return []

    def media_type_for(idx: int) -> str:
        if media_style == "image":
            return "image"
        if media_style == "combined":
            # Every 3rd beat is a still (hook/emotional beat) for drama pacing.
            return "image" if idx % 3 == 2 else "video"
        return "video"

    scenes: List[dict] = []
    buffer: List[str] = []
    buf_words = 0
    for sentence in sentences:
        buffer.append(sentence)
        buf_words += len(sentence.split())
        est = buf_words / _WORDS_PER_SECOND
        # Emit a beat once it reaches ~5s, or at the final sentence.
        if est >= 5 or sentence is sentences[-1]:
            beat = " ".join(buffer).strip()
            if beat:
                idx = len(scenes)
                scenes.append(
                    {
                        "index": idx + 1,
                        "beat": beat,
                        "duration": round(max(1.0, est), 1),
                        "keywords": _heuristic_keywords(sentence),
                        "source": "pexels",
                        "media_type": media_type_for(idx),
                    }
                )
            buffer = []
            buf_words = 0
    return scenes


def _llm_generate(prompt: str, app_config=None) -> str:
    # Lazy import so the deterministic fallback path never requires the
    # OpenAI SDK (which is only needed when an LLM provider is configured).
    from app.services.llm import _generate_response

    if app_config is not None:
        return _generate_response(prompt, app_config=app_config)
    return _generate_response(prompt)


def generate_scenes(
    video_script: str,
    video_subject: str = "",
    target_duration: int = 30,
    language: str = "",
    media_style: str = "combined",
    app_config=None,
) -> List[dict]:
    script = (video_script or "").strip()
    if not script:
        return []

    prompt = build_scene_prompt(
        video_script=script,
        video_subject=video_subject,
        target_duration=target_duration,
        language=language,
        media_style=media_style,
    )
    logger.info(
        f"generating scenes: subject={video_subject}, target={target_duration}s, "
        f"media_style={media_style}"
    )

    response = ""
    for i in range(_max_retries):
        try:
            response = _llm_generate(prompt, app_config=app_config)
            if isinstance(response, str) and response.startswith("Error:"):
                logger.error(f"failed to generate scenes: {response}")
                break
            scenes = _parse_scenes(response)
            logger.success(f"completed scenes: {len(scenes)} beats")
            return scenes
        except Exception as e:
            logger.warning(f"failed to parse scenes (attempt {i + 1}): {str(e)}")

    logger.warning("falling back to deterministic scene split")
    return _fallback_scenes(script, target_duration, media_style)


def scenes_to_terms(scenes) -> List[str]:
    """
    Extract ordered, de-duplicated footage search terms from a scene breakdown.

    Accepts either ``Scene`` pydantic objects or plain dicts, so it works both
    inside the task pipeline (pydantic) and against raw JSON. Order is preserved
    because scene order is narration order.
    """
    terms: List[str] = []
    for scene_item in scenes or []:
        if isinstance(scene_item, dict):
            keyword = scene_item.get("keywords")
        else:
            keyword = getattr(scene_item, "keywords", None)
        keyword = str(keyword or "").strip()
        if keyword and keyword not in terms:
            terms.append(keyword)
    return terms


def scenes_to_media_types(scenes) -> List[str]:
    """
    Extract the per-scene media types, aligned index-for-index with the terms
    returned by :func:`scenes_to_terms`. Falls back to "video" for any beat
    that does not declare a media type.
    """
    media_types: List[str] = []
    for scene_item in scenes or []:
        if isinstance(scene_item, dict):
            media_type = scene_item.get("media_type")
        else:
            media_type = getattr(scene_item, "media_type", None)
        media_types.append(_normalize_media_type(media_type))
    return media_types


def preview_scenes(
    scenes,
    source: str = "pexels",
    video_aspect: str = "9:16",
) -> List[dict]:
    """Resolve a thumbnail/low-res preview for each scene beat (batch).

    Accepts ``Scene`` pydantic objects or plain dicts, matching the shape the
    UI already holds after ``/api/v1/scenes``. Each returned item carries the
    original ``index``/``keywords``/``media_type`` plus public ``preview_url``
    (poster/thumbnail) and, for video beats, a low-res ``video_url`` loop.
    """
    from app.services import material

    previews: List[dict] = []
    for idx, scene_item in enumerate(scenes or [], 1):
        if isinstance(scene_item, dict):
            keywords = str(scene_item.get("keywords") or "").strip()
            media_type = _normalize_media_type(scene_item.get("media_type"))
            index = scene_item.get("index", idx)
            page = int(scene_item.get("page", 1) or 1)
        else:
            keywords = str(getattr(scene_item, "keywords", "") or "").strip()
            media_type = _normalize_media_type(getattr(scene_item, "media_type", "video"))
            index = getattr(scene_item, "index", idx)
            page = int(getattr(scene_item, "page", 1) or 1)
        if not keywords:
            previews.append(
                {
                    "index": index,
                    "keywords": keywords,
                    "media_type": media_type,
                    "provider": source,
                    "preview_url": None,
                    "video_url": None,
                    "source_page": None,
                }
            )
            continue
        preview = material.search_preview(
            search_term=keywords,
            media_type=media_type,
            source=source,
            video_aspect=video_aspect,
            page=page,
        )
        preview["index"] = index
        preview["keywords"] = keywords
        previews.append(preview)
    return previews
