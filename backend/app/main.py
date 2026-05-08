from fastapi import FastAPI
from .config import settings

app = FastAPI(title=settings.app_name)
app.debug = settings.debug

@app.get("/health")
async def health_check():
    return {"status": "ok"}