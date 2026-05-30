# Maptory — Производственная карта безопасности и качества

## Описание
Веб-приложение для визуализации производственного цеха. Загружается план цеха (SVG), на него накладываются слои с точками, каждая из которых содержит информацию о конкретном месте на производстве.

Пример: карта цеха → слой «Электробезопасность» → точки — аварийные выключатели с фото и инструкцией.

## Реализованные фичи

### Итерация 1 — Фундамент ✅
- [x] Структура проекта
- [x] Бэкенд: FastAPI + SQLAlchemy async + PostgreSQL
- [x] Модель User
- [x] Регистрация / Логин / JWT
- [x] Фронтенд: Vite + React 19 + TypeScript + TailwindCSS
- [x] Страницы входа и регистрации
- [x] AuthContext (login/register/logout + token management)
- [x] Dockerfile (multi-stage: Node → Python)
- [x] docker-compose.yml (app + PostgreSQL)

### Итерация 2 — Карты + SVG (в планах)
- [ ] CRUD карт
- [ ] Загрузка SVG-файла
- [ ] Dashboard со списком карт
- [ ] MapViewer — отрисовка SVG с зумом/паном

### Итерация 3 — Слои и точки (в планах)
- [ ] CRUD слоёв с произвольными атрибутами (JSON)
- [ ] CRUD точек
- [ ] Клик по SVG → форма точки
- [ ] PointMarker на карте
- [ ] LayerPanel с переключением слоёв
- [ ] Загрузка фото

### Итерация 4 — Полировка (в планах)
- [ ] Адаптивный просмотр (sidebar / bottom sheet)
- [ ] Hover-тултип на desktop
- [ ] Валидация, ошибки, загрузочные состояния

## Архитектура БД
```
User (id, username, email, hashed_password, is_active)
  └── Map (id, name, description, svg_path, owner_id, created_at)
        └── Layer (id, name, map_id, fields: JSON, is_visible)
              └── Point (id, x: float, y: float, layer_id, data: JSON, photos: JSON[], created_at)
```

## API Endpoints
### Auth
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — логин → JWT
- `GET /api/auth/me` — текущий пользователь (JWT required)
