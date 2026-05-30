# Maptory — Производственная карта безопасности и качества

## Стек
- **Backend:** FastAPI + SQLAlchemy (async) + PostgreSQL
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS + React Router 6 + Axios
- **Auth:** JWT (python-jose) + bcrypt (passlib)
- **Deploy:** Docker Compose (app + PostgreSQL)

## Команды

### Запуск на сервере (Docker)
```bash
docker compose up --build -d
# Приложение доступно на http://<server-ip>:8007
```

### Локальная разработка (без Docker)
```bash
# Бэкенд
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Фронтенд (в другом терминале)
cd frontend
npm install
npm run dev
# Фронтенд на http://localhost:3000, проксирует API на :8000
```

## Структура проекта
```
backend/app/
├── main.py          # FastAPI entrypoint, routers, static/SPA serving
├── database.py      # SQLAlchemy async engine, session, Base
├── models.py        # SQLAlchemy models: User, Map, Layer, Point
├── schemas.py       # Pydantic v2 schemas
├── auth.py          # JWT utils, password hashing, HTTPBearer
└── routers/
    ├── __init__.py
    └── auth.py      # /api/auth/register, /api/auth/login, /api/auth/me

frontend/src/
├── main.tsx         # React entrypoint
├── App.tsx          # Router + AuthProvider
├── api/client.ts    # Axios instance с JWT-интерцептором
├── types/index.ts   # TypeScript interfaces
├── context/AuthContext.tsx  # Auth state (login/register/logout)
└── pages/
    ├── LoginPage.tsx
    └── DashboardPage.tsx
```

## Особенности
- **API-маршруты** имеют префикс `/api/` (например `/api/auth/login`)
- **Файлы** (SVG-карты, фото точек) хранятся на ФС в `uploads/`
- **Координаты точек** хранятся в % (0-100) от ширины/высоты SVG
- **Атрибуты точек** — JSON, определяются шаблоном слоя (`fields` в Layer)
- **Типы полей слоя:** `text`, `number`, `checkbox`, `date`
- **Маркеры точек** — HTML-элементы поверх SVG-фона (не внутри SVG)
- **SPA-роутинг:** FastAPI отдаёт `index.html` для всех не-API путей
- **CORS** открыт для всех origins (для dev)

## БД модели
- `User` — id, username, email, hashed_password, is_active
- `Map` — id, name, description, svg_path, owner_id, created_at
- `Layer` — id, name, map_id, fields(JSON), is_visible
- `Point` — id, x(%), y(%), layer_id, data(JSON), photos(JSON[]), created_at

## Docker
- `docker-compose.yml` — app + PostgreSQL
- `Dockerfile` — multi-stage: Node для сборки фронтенда → Python для бэкенда
- Volume `uploads` для файлов, `pgdata` для БД
