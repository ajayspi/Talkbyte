# Operating units

Three isolated products. Code still lives in `frontend/` + `backend/` (one Next app, one FastAPI). These folders are the operating docs — do not copy `node_modules`.

| Unit | Folder | Code | Audience |
|------|--------|------|----------|
| Landing | `landing/` | `frontend/src/app/{page,how-it-works,pricing,contact,privacy,terms}` + `public/landing.html` | Public |
| Restaurant | `restaurant-backend/` | `backend/app/api/{voice,orders,restaurants,payments}` + `frontend/src/app/(restaurant)` | Venue staff |
| Operator | `operator-backend/` | `backend/app/api/admin.py` + `frontend/src/app/(admin)` | TalkByte staff |

Each unit has `INSTRUCTIONS.md` + `CLAUDE.md`.

Ignore: nested `Talkbyte/`, `Talkbyte-1/` (duplicate git checkouts). Helper `*.py` at repo root are one-off scripts, not units.
