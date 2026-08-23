# Deploying ProstudioX on Oracle Cloud Always Free (ARM)

This is a CPU-only, free-tier deployment of the MoneyPrinterTurbo backend plus
the ProstudioX extensions (scenes + cast), driven by a resumable queue
scheduler. It renders stock-footage + AI-voiceover shorts with FFmpeg — no GPU,
no image-to-video yet.

## Target shape

- **Instance:** Ampere A1 (ARM) — 4 OCPU, 24 GB RAM, 200 GB boot volume
  (all within Always Free).
- **OS:** Ubuntu 22.04 / 24.04 LTS (aarch64).
- **Stack:** Python 3.10+ venv, MoneyPrinterTurbo API (`main.py`, uvicorn),
  FFmpeg, the `deploy/scheduler.py` queue worker, systemd for both.

Capacity on this shape: roughly 150–300 shorts/day (stock + TTS), constrained
by CPU-bound FFmpeg renders — hence the scheduler renders **one at a time**.

## 1. Provision the instance

1. Create an Ampere A1 instance in your home region (4 OCPU / 24 GB is free;
   2 OCPU / 12 GB also works but is slower).
2. Attach the default Ubuntu image, add your SSH key, and open port **22**
   (and **8080** only if you want the API reachable externally — recommended:
   keep it on `127.0.0.1` and SSH-tunnel in).

## 2. Install system deps

```bash
sudo apt update && sudo apt install -y \
  python3 python3-venv python3-pip ffmpeg git curl
```

## 3. Check out and set up the app

```bash
sudo mkdir -p /opt/prostudiox && sudo chown $USER:$USER /opt/prostudiox
cd /opt/prostudiox
git clone https://github.com/ajayspi/MoneyPrinterTurbo.git
cd MoneyPrinterTurbo
python3 -m venv /opt/prostudiox/venv
source /opt/prostudiox/venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

Copy `config.example.toml` → `config.toml` and fill in at minimum:

- `pexels_api_keys` (or `pixabay_api_keys`) — stock footage source.
- `llm_provider` + its API key (for script/terms) — or leave unset to use the
  deterministic fallback for scenes; script generation still needs an LLM key.
- `subtitle_provider = "edge"` (free, uses the TTS timeline).
- A TTS provider (Edge is free by default).

Leave `enable_redis = false` — the in-memory task manager is fine for a single
instance and avoids a Redis dependency on the free tier.

## 4. Start the API

```bash
sudo cp deploy/systemd/prostudiox-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now prostudiox-api
curl http://127.0.0.1:8080/ping   # expect {"code":0,...}
```

## 5. Point the scheduler at your queue

Drop the Faceless Video Studio export at `/opt/prostudiox/queue.json` (the same
JSON the web app exports). Then:

```bash
sudo cp deploy/systemd/prostudiox-scheduler.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now prostudiox-scheduler
```

The scheduler renders one job at a time, records progress in
`/opt/prostudiox/videos/state.json`, and writes finished MP4s next to it.

### Manual one-shot run (for testing)

```bash
source /opt/prostudiox/venv/bin/activate
python deploy/scheduler.py \
  --base-url http://127.0.0.1:8080 \
  --queue /opt/prostudiox/queue.json \
  --output-dir /opt/prostudiox/videos
```

## 6. Keep the queue full

Update `queue.json` from the Faceless Video Studio web app (or any producer)
and the scheduler picks up new jobs on its next loop. To re-run a failed job,
set its entry in `state.json` back to `{"status": "queued"}` (or delete the
entry) and the scheduler retries it.

## Monitoring

```bash
sudo journalctl -u prostudiox-api -f        # API logs
sudo journalctl -u prostudiox-scheduler -f  # render queue
ls -la /opt/prostudiox/videos               # finished MP4s
cat /opt/prostudiox/videos/state.json       # per-job status
```

## CPU/thermal notes

- The scheduler's `--max-concurrent 1` is deliberate: parallel MoviePy renders
  on the A1 spike all 4 OCPU and can stall TTS/FFmpeg. Raise it only after
  measuring.
- `Nice=5` (API) and `Nice=10` (scheduler) keep the box responsive for SSH.
- If you later add image-to-video, revisit concurrency — that workload is far
  heavier and may exceed the free tier's CPU comfortably.
