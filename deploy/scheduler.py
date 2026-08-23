#!/usr/bin/env python3
"""ProstudioX — queue scheduler for the MoneyPrinterTurbo API.

Reads the queue exported by the Faceless Video Studio web app (a JSON array of
job objects), submits each job to the running MoneyPrinterTurbo API, polls to
completion, and downloads the finished videos. Tuned for the Oracle Cloud
Always Free ARM tier: one render at a time by default, resumable, and idempotent.

Queue job shape (matches the web app export)::

    {
      "id": "v1001",
      "title": "5 money habits that keep you broke",
      "niche": "Personal Finance",
      "format": "short",        # "short" -> 9:16, "long" -> 16:9
      "topic": "...",
      "status": "scripted",     # "scripted"|"idea" (informational)
      "body": "The narration script...",
      "created": "2026-08-24T01:58:00Z"
    }

Usage::

    python deploy/scheduler.py --base-url http://127.0.0.1:8080 \
        --queue /path/to/queue.json --output-dir /srv/videos

Run once (pair with a systemd timer / cron), or continuously with ``--loop``.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

import requests

# MoneyPrinterTurbo task states (app.models.const).
TASK_STATE_COMPLETE = 1
TASK_STATE_FAILED = -1

DEFAULT_ASPECT_BY_FORMAT = {
    "short": "9:16",
    "long": "16:9",
    "square": "1:1",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: str, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save_json(path: str, data) -> None:
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


class Scheduler:
    def __init__(
        self,
        base_url: str,
        queue_path: str,
        output_dir: str,
        state_path: str | None = None,
        poll_interval: float = 10.0,
        timeout: float = 1800.0,
        max_concurrent: int = 1,
        voice_name: str = "",
        api_key: str = "",
    ):
        self.base_url = base_url.rstrip("/")
        self.queue_path = queue_path
        self.output_dir = output_dir
        self.state_path = state_path or os.path.join(output_dir, "state.json")
        self.poll_interval = poll_interval
        self.timeout = timeout
        self.max_concurrent = max(1, max_concurrent)
        self.voice_name = voice_name
        self.session = requests.Session()
        if api_key:
            self.session.headers["Authorization"] = f"Bearer {api_key}"
        os.makedirs(self.output_dir, exist_ok=True)

    # ---- HTTP helpers ----------------------------------------------------
    def _post(self, path: str, body: dict) -> dict:
        resp = self.session.post(
            f"{self.base_url}{path}", json=body, timeout=60
        )
        resp.raise_for_status()
        return resp.json()

    def _get(self, path: str) -> dict:
        resp = self.session.get(f"{self.base_url}{path}", timeout=60)
        resp.raise_for_status()
        return resp.json()

    # ---- State helpers ----------------------------------------------------
    def _load_state(self) -> dict:
        return load_json(self.state_path, {})

    def _save_state(self, state: dict) -> None:
        save_json(self.state_path, state)

    # ---- Job mapping ------------------------------------------------------
    def _job_to_params(self, job: dict) -> dict:
        fmt = str(job.get("format") or "short").lower()
        params = {
            "video_subject": str(job.get("title") or job.get("topic") or job.get("id") or "").strip(),
            "video_script": str(job.get("body") or "").strip(),
            "video_aspect": DEFAULT_ASPECT_BY_FORMAT.get(fmt, "9:16"),
            "video_language": str(job.get("language") or "en"),
        }
        if self.voice_name:
            params["voice_name"] = self.voice_name
        # Passthrough the optional ProstudioX scene breakdown if the job has one.
        if job.get("scenes"):
            params["scenes"] = job["scenes"]
        return params

    # ---- Submission -------------------------------------------------------
    def _submit(self, params: dict) -> str:
        payload = self._post("/api/v1/videos", params)
        data = payload.get("data") or {}
        task_id = data.get("task_id")
        if not task_id:
            raise RuntimeError(f"no task_id in response: {payload}")
        return task_id

    def _poll(self, task_id: str) -> dict:
        """Poll until terminal; return (state, task_data)."""
        deadline = time.time() + self.timeout
        while time.time() < deadline:
            payload = self._get(f"/api/v1/tasks/{task_id}")
            task = (payload.get("data") or {})
            state = task.get("state")
            if state == TASK_STATE_COMPLETE:
                return "done", task
            if state == TASK_STATE_FAILED:
                return "failed", task
            time.sleep(self.poll_interval)
        return "timeout", {}

    def _download(self, task_id: str, video_uri: str, job_id: str) -> str:
        """Download a finished video into output_dir; return local path."""
        name = f"{job_id}-{os.path.basename(video_uri.rstrip('/')) or 'final-1.mp4'}"
        if not name.lower().endswith(".mp4"):
            name += ".mp4"
        dest = os.path.join(self.output_dir, name)
        url = video_uri
        if url.startswith("/"):
            url = f"{self.base_url}{url}"
        with self.session.get(url, stream=True, timeout=600) as resp:
            resp.raise_for_status()
            with open(dest, "wb") as fh:
                for chunk in resp.iter_content(chunk_size=1 << 16):
                    fh.write(chunk)
        return dest

    # ---- Main loop ---------------------------------------------------------
    def process_one(self, job: dict, state: dict) -> None:
        job_id = str(job.get("id") or f"job-{len(state)}")
        entry = state.setdefault(job_id, {"status": "queued"})
        if entry.get("status") == "done":
            return

        params = self._job_to_params(job)
        print(f"[{job_id}] submitting: {params['video_subject'][:60]}")
        entry["status"] = "processing"
        entry["submitted_at"] = _now_iso()
        self._save_state(state)

        try:
            task_id = self._submit(params)
            entry["task_id"] = task_id
            self._save_state(state)

            result, task = self._poll(task_id)
            if result == "done":
                videos = task.get("videos") or []
                local = []
                for uri in videos:
                    try:
                        local.append(self._download(task_id, uri, job_id))
                    except Exception as exc:
                        print(f"[{job_id}] download failed for {uri}: {exc}")
                entry["status"] = "done"
                entry["videos"] = local
                entry["finished_at"] = _now_iso()
                print(f"[{job_id}] DONE -> {local}")
            elif result == "failed":
                entry["status"] = "failed"
                entry["error"] = task.get("error") or "task failed"
                print(f"[{job_id}] FAILED: {entry['error']}")
            else:
                entry["status"] = "timeout"
                entry["error"] = f"timed out after {self.timeout}s"
                print(f"[{job_id}] TIMEOUT")
        except Exception as exc:
            entry["status"] = "failed"
            entry["error"] = f"{type(exc).__name__}: {exc}"
            print(f"[{job_id}] ERROR: {entry['error']}")
        finally:
            self._save_state(state)

    def run_once(self) -> None:
        queue = load_json(self.queue_path, [])
        if not isinstance(queue, list):
            raise ValueError("queue file must contain a JSON array")
        state = self._load_state()
        pending = [j for j in queue if state.get(str(j.get("id"))) != {"status": "done"}]
        # One render at a time is the free-tier-safe default; honour max_concurrent.
        for job in pending[: self.max_concurrent]:
            self.process_one(job, state)

    def run_loop(self) -> None:
        print("scheduler loop started (Ctrl-C to stop)")
        while True:
            try:
                self.run_once()
            except Exception as exc:
                print(f"loop error: {exc}")
            time.sleep(max(5.0, self.poll_interval))


def main() -> int:
    parser = argparse.ArgumentParser(description="ProstudioX queue scheduler")
    parser.add_argument("--base-url", default="http://127.0.0.1:8080")
    parser.add_argument("--queue", required=True, help="path to queue.json")
    parser.add_argument("--output-dir", default="./videos")
    parser.add_argument("--state", help="state file (default: <output-dir>/state.json)")
    parser.add_argument("--poll-interval", type=float, default=10.0)
    parser.add_argument("--timeout", type=float, default=1800.0)
    parser.add_argument("--max-concurrent", type=int, default=1)
    parser.add_argument("--voice-name", default="", help="override voice_name")
    parser.add_argument("--api-key", default="", help="optional Bearer token")
    parser.add_argument("--loop", action="store_true", help="run continuously")
    args = parser.parse_args()

    sched = Scheduler(
        base_url=args.base_url,
        queue_path=args.queue,
        output_dir=args.output_dir,
        state_path=args.state,
        poll_interval=args.poll_interval,
        timeout=args.timeout,
        max_concurrent=args.max_concurrent,
        voice_name=args.voice_name,
        api_key=args.api_key,
    )
    if args.loop:
        sched.run_loop()
    else:
        sched.run_once()
    return 0


if __name__ == "__main__":
    sys.exit(main())
