from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class MapCreate(BaseModel):
    name: str
    description: str = ""


class MapResponse(BaseModel):
    id: int
    name: str
    description: str
    svg_path: str
    owner_id: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LayerCreate(BaseModel):
    name: str
    fields: list[dict[str, Any]] = []


class LayerResponse(BaseModel):
    id: int
    name: str
    map_id: int
    fields: list[dict[str, Any]]
    is_visible: bool

    model_config = {"from_attributes": True}


class PointCreate(BaseModel):
    x: float
    y: float
    data: dict[str, Any] = {}


class PointResponse(BaseModel):
    id: int
    x: float
    y: float
    layer_id: int
    data: dict[str, Any]
    photos: list[str]
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
