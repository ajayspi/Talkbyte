"""
ProstudioX backend smoke test.

Verifies the scene breakdown module without starting the FastAPI server and
without any LLM API key (the scene breakdown exercises its deterministic
fallback). Run from the repo root:

    python prostudiox_smoke.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_schema():
    from app.models.schema import Scene, VideoParams

    scenes = [
        Scene(index=1, beat="Every morning, before you reach for your phone.", duration=6.4, keywords="sunrise bedroom"),
        Scene(index=2, beat="Your inbox has been sorted.", duration=5.1, keywords="city commute"),
    ]
    params = VideoParams(
        video_subject="How AI is changing everyday life",
        scenes=scenes,
    )
    dumped = params.model_dump()
    assert dumped["scenes"][0]["keywords"] == "sunrise bedroom"
    # classic task without ProstudioX fields still validates
    VideoParams(video_subject="plain task")
    print("[ok] schema: VideoParams + Scene")


def test_scene_service():
    from app.services import scene

    script = (
        "Every morning, before you even reach for your phone, a dozen quiet "
        "decisions have already been made for you. Your inbox has been sorted. "
        "Your commute has been re-routed. None of it announces itself. "
        "The most useful AI is the kind you never notice."
    )
    # deterministic fallback must return non-empty beats
    beats = scene._fallback_scenes(script, target_duration=30)
    assert beats and all(b["beat"] and b["duration"] > 0 for b in beats)
    # full path degrades gracefully without a configured LLM
    scenes = scene.generate_scenes(
        video_script=script, video_subject="Everyday AI", target_duration=30
    )
    assert scenes and all("keywords" in s and "duration" in s for s in scenes)
    # scenes_to_terms preserves order and de-duplicates
    terms = scene.scenes_to_terms(
        [{"keywords": "a"}, {"keywords": "b"}, {"keywords": "a"}]
    )
    assert terms == ["a", "b"]
    # media_type is normalized and exposed per beat
    assert all("media_type" in s for s in scenes)
    mt = scene.scenes_to_media_types(scenes)
    assert len(mt) == len(scenes)
    assert set(mt) <= {"video", "image"}
    print(f"[ok] scene: {len(scenes)} beats via fallback (media types: {set(mt)})")


if __name__ == "__main__":
    test_schema()
    test_scene_service()
    print("\nAll ProstudioX backend smoke tests passed.")
