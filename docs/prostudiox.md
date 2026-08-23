# ProstudioX — scene breakdown extension on MoneyPrinterTurbo

This folder adds the scene-beat breakdown capability from the ProstudioX design
onto the existing MoneyPrinterTurbo codebase, following its established FastAPI
+ service patterns. Phase 1 focus is **free stock sources → video**; the
character/cast compositing work has been removed to keep the pipeline lean.

Everything is backward compatible: classic tasks still work unchanged, and the
new `scenes` field is optional.

## What was added

| Feature | Files | Status |
| --- | --- | --- |
| Scene beat breakdown | `app/services/scene.py`, `app/controllers/v1/scene.py`, schema models | working + smoke-tested |
| Per-scene media type (video/image/combined) | `Scene.media_type` + material search/save + `combine_videos` ken-burns | working + unit-tested |
| Task data model extension | `app/models/schema.py` (`Scene`; `VideoParams.scenes`) | working |
| Per-scene clip timing | `app/services/video.py` (`_per_clip_duration`, `clip_durations`) + `app/services/task.py` | working + unit-tested |
| Router wiring | `app/router.py` | wired |
| WebUI scenes panel | `webui/Main.py` (`_render_prostudiox_panel`) | working |
| Queue scheduler + deploy | `deploy/scheduler.py`, `deploy/systemd/*`, `deploy/DEPLOY.md` | working |
| Smoke test | `prostudiox_smoke.py` | passing |

## New API endpoint

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/v1/scenes` | Break a narration script into shot-length beats (beat text, duration, English footage keyword) |

### Example — scene breakdown

```bash
curl -X POST http://localhost:8080/api/v1/scenes \
  -H "Content-Type: application/json" \
  -d '{
    "video_script": "Every morning, before you reach for your phone...",
    "video_subject": "How AI is changing everyday life",
    "target_duration": 30
  }'
```

Returns `data.scenes` as an array of `{index, beat, duration, keywords, source, media_type}`.
`media_type` is `"video"` (stock clip) or `"image"` (still photo with a slow
ken-burns zoom). When no LLM provider is configured (or the call fails), the
service falls back to a deterministic sentence-split, so it always returns a
usable list.

### Sourcing styles

`media_style` controls how each beat's `media_type` is assigned:

| `media_style` | Behaviour |
| --- | --- |
| `video` | every scene uses a stock video clip |
| `image` | every scene uses a still photo (ken-burns) |
| `combined` (default) | alternates ~3s video clips with still shots for a dramatic "speech ad" feel |

## How it plugs into the render pipeline

The ProstudioX scene step does two things the classic pipeline lacked:

1. **Footage keywords** — `scene.generate_scenes()` returns timed beats with
   per-beat footage keywords. `task.generate_terms()` prefers these scene-derived
   keywords over a flat term list, so each shot's footage is searched in
   narration order.
2. **Per-beat media type** — each beat's `media_type` (`video`/`image`) is passed
   through `task.get_video_materials()` to `material.download_videos(...)`,
   which searches and downloads either a stock clip or a stock photo per beat.
   Still images are converted to ken-burns clips in `combine_videos`.
3. **Per-beat timing** — `task.generate_final_videos()` forces `sequential`
   concat mode when scenes are present and passes per-scene durations to
   `video.combine_videos(..., clip_durations=...)`, so each clip's length matches
   its narration beat instead of the flat `video_clip_duration`.

The optional `scenes` field on `VideoParams` is plumbed through
`body.model_dump()` into every task.

## Remaining work (not in this pass)

- **Image-to-video**: the longer-term plan; the render pipeline (stock + TTS +
  FFmpeg) is deliberately reusable for it. Character/compositing would be
  reintroduced as part of that phase, not phase 1.

## Verify

```bash
# no API key required — exercises the deterministic fallback
python prostudiox_smoke.py
```
