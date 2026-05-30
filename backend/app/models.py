from datetime import datetime
from typing import Any
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    maps: Mapped[list["Map"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Map(Base):
    __tablename__ = "maps"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(String(1000), default="")
    svg_path: Mapped[str] = mapped_column(String(500), default="")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="maps")
    layers: Mapped[list["Layer"]] = relationship(back_populates="map", cascade="all, delete-orphan")


class Layer(Base):
    __tablename__ = "layers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    map_id: Mapped[int] = mapped_column(ForeignKey("maps.id"))
    fields = Column(JSON, default=list)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)

    map: Mapped["Map"] = relationship(back_populates="layers")
    points: Mapped[list["Point"]] = relationship(back_populates="layer", cascade="all, delete-orphan")


class Point(Base):
    __tablename__ = "points"

    id: Mapped[int] = mapped_column(primary_key=True)
    x: Mapped[float] = mapped_column()
    y: Mapped[float] = mapped_column()
    layer_id: Mapped[int] = mapped_column(ForeignKey("layers.id"))
    data = Column(JSON, default=dict)
    photos = Column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    layer: Mapped["Layer"] = relationship(back_populates="points")
