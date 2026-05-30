# Stage 1: Build frontend
FROM node:22-alpine AS frontend
WORKDIR /app

# Install CA certificate for on-prem registry
COPY frontend/root.crt /usr/local/share/ca-certificates/root.crt
RUN update-ca-certificates

# Configure npm for on-prem registry
RUN npm set registry https://infra-reg.myizhora.net/repository/npm-proxy/ \
    && npm config set cafile="/usr/local/share/ca-certificates/root.crt"

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Python backend
FROM python:3.13-slim
WORKDIR /app

# Install CA certificate for on-prem pypi
COPY backend/root.crt /usr/local/share/ca-certificates/root.crt
RUN update-ca-certificates

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure pip for on-prem index
RUN pip config set global.index-url https://infra-reg.myizhora.net/repository/pypi-proxy/simple \
    && pip config set global.trusted-host infra-reg.myizhora.net

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app/ ./app/
COPY --from=frontend /app/dist ./static/
RUN mkdir -p ./uploads/maps ./uploads/photos

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
