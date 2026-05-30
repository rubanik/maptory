from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import Layer, Map
from ..schemas import LayerCreate, LayerResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/maps/{map_id}/layers", tags=["layers"])


@router.get("/", response_model=list[LayerResponse])
async def get_layers(map_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Layer).where(Layer.map_id == map_id))
    layers = result.scalars().all()
    return layers


@router.post("/", response_model=LayerResponse)
async def create_layer(
    map_id: int,
    body: LayerCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Map).where(Map.id == map_id))
    map_ = result.scalar_one_or_none()
    if not map_:
        raise HTTPException(status_code=404, detail="Map not found")

    layer = Layer(
        name=body.name,
        map_id=map_id,
        fields=body.fields,
    )
    db.add(layer)
    await db.commit()
    await db.refresh(layer)
    return layer


@router.get("/{layer_id}", response_model=LayerResponse)
async def get_layer(map_id: int, layer_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Layer).where(Layer.id == layer_id, Layer.map_id == map_id))
    layer = result.scalar_one_or_none()
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    return layer


@router.put("/{layer_id}", response_model=LayerResponse)
async def update_layer(
    map_id: int,
    layer_id: int,
    body: LayerCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Layer).where(Layer.id == layer_id, Layer.map_id == map_id))
    layer = result.scalar_one_or_none()
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    layer.name = body.name
    layer.fields = body.fields
    await db.commit()
    await db.refresh(layer)
    return layer


@router.patch("/{layer_id}/visibility")
async def toggle_visibility(
    map_id: int,
    layer_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Layer).where(Layer.id == layer_id, Layer.map_id == map_id))
    layer = result.scalar_one_or_none()
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    layer.is_visible = not layer.is_visible
    await db.commit()
    return {"is_visible": layer.is_visible}


@router.delete("/{layer_id}")
async def delete_layer(map_id: int, layer_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Layer).where(Layer.id == layer_id, Layer.map_id == map_id))
    layer = result.scalar_one_or_none()
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    await db.delete(layer)
    await db.commit()
    return {"detail": "Layer deleted"}