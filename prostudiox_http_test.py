"""
ProstudioX HTTP test — proves the scene endpoint responds over real HTTP.

Builds a minimal FastAPI app containing ONLY the scene router and drives it
with TestClient. This avoids the full MoneyPrinterTurbo dependency chain
(redis/moviepy/whisper/...) while still exercising the real request/response
path.

Run from repo root:  python prostudiox_http_test.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def run():
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from fastapi.testclient import TestClient

    from app.controllers.v1 import scene
    from app.models.exception import HttpException

    app = FastAPI()
    app.include_router(scene.router)

    # Mirror production asgi.py: translate HttpException -> its status code.
    @app.exception_handler(HttpException)
    def http_exc_handler(request, e: HttpException):
        return JSONResponse(
            status_code=e.status_code,
            content={"status": e.status_code, "message": e.message},
        )

    client = TestClient(app)

    # scene breakdown
    r = client.post(
        "/api/v1/scenes",
        json={
            "video_script": (
                "Every morning, before you even reach for your phone, a dozen "
                "quiet decisions have already been made for you. Your inbox has "
                "been sorted. Your commute has been re-routed. None of it "
                "announces itself. The most useful AI is the kind you never notice."
            ),
            "video_subject": "Everyday AI",
            "target_duration": 30,
        },
    )
    assert r.status_code == 200, r.text
    scenes = r.json()["data"]["scenes"]
    assert scenes and all("keywords" in s for s in scenes)
    print(f"[ok] POST /scenes -> {len(scenes)} beats")

    print("\nAll ProstudioX HTTP endpoint tests passed.")


if __name__ == "__main__":
    run()
