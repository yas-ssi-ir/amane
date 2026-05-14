FROM python:3.11-slim

WORKDIR /app

# Dépendances système pour OpenCV et Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code source
COPY . .

# Volume pour les uploads (persistés hors du container)
VOLUME ["/app/backend/uploads"]

EXPOSE 8000

# Démarrage en mode production (4 workers)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
