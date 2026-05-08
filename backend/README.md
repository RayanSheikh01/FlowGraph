# Backend Setup

Run these commands from the `backend/` directory:

1. `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`
2. `copy .env.example .env`
3. `uv sync`
4. `uv run uvicorn app.main:app --reload`
