from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import Map, User
from ..schemas import MapCreate, MapResponse
from ..auth import get_current_user
import os
import uuid

router = APIRouter(prefix="/api/maps", tags=["maps"])

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "maps")


@router.get("/", response_model=list[MapResponse])
async def get_maps(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Map))
    maps = result.scalars().all()
    return maps


@router.post("/", response_model=MapResponse)
async def create_map(
    body: MapCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    map_ = Map(
        name=body.name,
        description=body.description,
        owner_id=current_user.id,
    )
    db.add(map_)
    await db.commit()
    await db.refresh(map_)
    return map_


@router.get("/{map_id}", response_model=MapResponse)
async def get_map(map_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Map).where(Map.id == map_id))
    map_ = result.scalar_one_or_none()
    if not map_:
        raise HTTPException(status_code=404, detail="Map not found")
    return map_


@router.put("/{map_id}", response_model=MapResponse)
async def update_map(
    map_id: int,
    body: MapCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Map).where(Map.id == map_id))
    map_ = result.scalar_one_or_none()
    if not map_:
        raise HTTPException(status_code=404, detail="Map not found")
    map_.name = body.name
    map_.description = body.description
    await db.commit()
    await db.refresh(map_)
    return map_


@router.delete("/{map_id}")
async def delete_map(map_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Map).where(Map.id == map_id))
    map_ = result.scalar_one_or_none()
    if not map_:
        raise HTTPException(status_code=404, detail="Map not found")
    if map_.svg_path:
        filepath = os.path.join(UPLOADS_DIR, map_.svg_path)
        if os.path.exists(filepath):
            os.remove(filepath)
    await db.execute(delete(Map).where(Map.id == map_id))
    await db.commit()
    return {"detail": "Map deleted"}


@router.post("/{map_id}/upload-svg")
async def upload_svg(
    map_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.endswith(".svg"):
        raise HTTPException(status_code=400, detail="Only SVG files are allowed")

    result = await db.execute(select(Map).where(Map.id == map_id))
    map_ = result.scalar_one_or_none()
    if not map_:
        raise HTTPException(status_code=404, detail="Map not found")

    filename = f"{uuid.uuid4().hex}.svg"
    filepath = os.path.join(UPLOADS_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    map_.svg_path = filename
    await db.commit()
    await db.refresh(map_)
    return {"svg_path": f"/uploads/maps/{filename}"}