"""
AMANE - Application FastAPI (factory)
Charge la configuration, les middlewares, et monte les routeurs.
La logique métier est dans backend/routers/.
"""

from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text as sql_text

from .core import ai_state
from .core.config import (
    CREDENTIAL_DIR, HEATMAP_DIR, UPLOAD_DIR, VIDEO_DIR,
)
from .database import (
    create_tables, ensure_columns, ensure_indexes, get_db,
)
from .routers import admin, auth, chat, consultations, dashboard

logger = logging.getLogger("amane")
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","msg":%(message)s}',
)


# ============================================
# Lifespan — initialisation / arrêt propre
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    for d in (UPLOAD_DIR, HEATMAP_DIR, VIDEO_DIR, CREDENTIAL_DIR):
        os.makedirs(d, exist_ok=True)

    create_tables()
    ensure_columns()
    ensure_indexes()

    ai_state.init()

    logger.info("AMANE API démarrée.")
    yield
    # Shutdown (rien à nettoyer pour l'instant)
    logger.info("AMANE API arrêtée.")


# ============================================
# Application
# ============================================
app = FastAPI(
    title="AMANE — Infrastructure de Confiance Médicale",
    description="L'IA au service de l'humain — Diagnostic assisté pour zones rurales",
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS ---
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]
_env_origins = os.getenv("CORS_ORIGINS", "").strip()
allowed_origins = (
    [o.strip() for o in _env_origins.split(",") if o.strip()]
    if _env_origins
    else _default_origins
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    expose_headers=["X-Total-Count"],
    max_age=600,
)


# --- Security headers ---
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: blob:; "
        "media-src 'self' blob:; "
        "connect-src 'self'; "
        "font-src 'self'; "
        "script-src 'none'; "
        "frame-ancestors 'none';"
    )
    return response


# --- Fichiers statiques ---
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Routeurs ---
app.include_router(auth.router)
app.include_router(consultations.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(chat.router)


# --- Endpoints utilitaires ---
@app.get("/")
def home():
    return {
        "status": "online",
        "app": "AMANE — Infrastructure de Confiance Médicale",
        "version": "1.0.0",
    }


@app.get("/api/health")
def health_check(db=None):
    from .database import get_db as _get_db
    from sqlalchemy.orm import Session
    checks: dict[str, str] = {}

    db_gen = _get_db()
    db_session: Session = next(db_gen)
    try:
        db_session.execute(sql_text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {type(e).__name__}"
    finally:
        db_session.close()

    classifier = ai_state.classifier
    checks["ai_model"] = (
        "loaded" if classifier is not None and getattr(classifier, "model", None) is not None
        else "not loaded"
    )
    if classifier:
        checks["ai_temperature"] = f"{classifier.temperature:.3f}"
        checks["ai_uncertainty_threshold"] = f"{classifier.uncertainty_threshold:.2f}"

    gemini = ai_state.gemini
    checks["gemini"] = "enabled" if (gemini and gemini.enabled) else "disabled"
    checks["heatmap_explainer"] = "ready" if ai_state.explainer is not None else "missing"

    healthy = checks.get("database") == "ok" and checks.get("ai_model") == "loaded"
    return {
        "status": "healthy" if healthy else "degraded",
        "checks": checks,
        "version": app.version,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
