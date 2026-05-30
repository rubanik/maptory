import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers.auth import router as auth_router
from .routers.maps import router as maps_router
from .routers.layers import router as layers_router
from .routers.points import router as points_router

app = FastAPI(title="Maptory")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(maps_router)
app.include_router(layers_router)
app.include_router(points_router)

STATIC_DIR = Path(__file__).parent.parent / "static"
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"


@app.on_event("startup")
async def startup():
    os.makedirs(str(UPLOADS_DIR / "maps"), exist_ok=True)
    os.makedirs(str(UPLOADS_DIR / "photos"), exist_ok=True)
    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
    app.mount("/uploads/maps", StaticFiles(directory=str(UPLOADS_DIR / "maps")), name="uploads_maps")
    app.mount("/uploads/photos", StaticFiles(directory=str(UPLOADS_DIR / "photos")), name="uploads_photos")
    await init_db()


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("uploads/"):
        raise HTTPException(status_code=404, detail="Not found")
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    raise HTTPException(status_code=404, detail="Frontend not built")
