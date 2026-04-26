# Warehouse Management

## Backend API

FastAPI backend lives in `apps/api` and uses SQLAlchemy + SQLite by default.

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r apps/api/requirements.txt
uvicorn apps.api.app.main:app --reload
```

Initial setup is explicit: call `POST /api/setup/init` with `{"confirm": true}` after confirming the database location. This creates the SQLite schema and fixed `admin/admin` application account. The username cannot be changed; use `POST /api/auth/change-password` after login to change the password.

Run backend tests:

```bash
pytest tests
```
