from fastapi import Request

from app.controllers.v1.base import new_router
from app.models.schema import (
    ScenePreviewRequest,
    ScenePreviewResponse,
    SceneRequest,
    SceneResponse,
)
from app.services import scene
from app.utils import utils

router = new_router()


@router.post(
    "/scenes",
    response_model=SceneResponse,
    summary="Break a narration script into shot-length scenes",
)
def generate_video_scenes(request: Request, body: SceneRequest):
    scenes = scene.generate_scenes(
        video_script=body.video_script,
        video_subject=body.video_subject,
        target_duration=body.target_duration,
        language=body.video_language,
        media_style=body.media_style,
    )
    response = {"scenes": scenes}
    return utils.get_response(200, response)


@router.post(
    "/scenes/preview",
    response_model=ScenePreviewResponse,
    summary="Resolve a thumbnail/low-res preview for each scene beat",
)
def preview_video_scenes(request: Request, body: ScenePreviewRequest):
    previews = scene.preview_scenes(
        body.scenes,
        source=body.source,
        video_aspect=body.video_aspect,
    )
    return utils.get_response(200, {"previews": previews})
