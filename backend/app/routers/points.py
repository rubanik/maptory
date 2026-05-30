from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import Point, Layer
from ..schemas import PointCreate, PointResponse
import os
import uuid

router = APIRouter(prefix="/api/maps/{map_id}/layers/{layer_id}/points", tags=["points"])

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "photos")


@router.get("/", response_model=list[PointResponse])
async def get_points(layer_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Point).where(Point.layer_id == layer_id))
    points = result.scalars().all()
    return points


@router.post("/", response_model=PointResponse)
async def create_point(
    layer_id: int,
    body: PointCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Layer).where(Layer.id == layer_id))
    layer = result.scalar_one_or_none()
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")

    point = Point(
        x=body.x,
        y=body.y,
        layer_id=layer_id,
        data=body.data,
    )
    db.add(point)
    await db.commit()
    await db.refresh(point)
    return point


@router.get("/{point_id}", response_model=PointResponse)
async def get_point(layer_id: int, point_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Point).where(Point.id == point_id, Point.layer_id == layer_id))
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    return point


@router.put("/{point_id}", response_model=PointResponse)
async def update_point(
    layer_id: int,
    point_id: int,
    body: PointCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Point).where(Point.id == point_id, Point.layer_id == layer_id))
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    point.x = body.x
    point.y = body.y
    point.data = body.data
    await db.commit()
    await db.refresh(point)
    return point


@router.delete("/{point_id}")
async def delete_point(layer_id: int, point_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Point).where(Point.id == point_id, Point.layer_id == layer_id))
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    for photo in point.photos:
        filepath = os.path.join(UPLOADS_DIR, photo)
        if os.path.exists(filepath):
            os.remove(filepath)
    await db.delete(point)
    await db.commit()
    return {"detail": "Point deleted"}


@router.post("/{point_id}/upload-photo")
async def upload_photo(
    point_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Point).where(Point.id == point_id))
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")

    allowed = ["image/png", "image/jpeg", "image/webp"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only PNG, JPEG, WebP allowed")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    if point.photos is None:
        point.photos = []
    point.photos.append(filename)
    await db.commit()
    return {"photo_path": f"/uploads/photos/{filename}"}


@router.delete("/{point_id}/photo/{filename}")
async def delete_photo(
    point_id: int,
    filename: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Point).where(Point.id == point_id))
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")

    filepath = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    if point.photos and filename in point.photos:
        point.photos.remove(filename)
        await db.commit()

    return {"detail": "Photo deleted"}