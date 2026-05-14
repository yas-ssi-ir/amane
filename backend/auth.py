"""
AMANE - Authentification JWT + Rate limiting

JWT signe HS256 avec secret en env (AMANE_JWT_SECRET). Si non defini,
genere un secret ephemere au demarrage avec warning (DEV uniquement).

Rate limiter : sliding window in-memory. OK pour dev / uvicorn single-worker.
En prod multi-worker -> Redis (slowapi-redis ou equivalent).
"""

import os
import time
import secrets
import logging
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db, User

# Instance unique de hachage bcrypt — importé par les routeurs qui gèrent les mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


logger = logging.getLogger("amane.auth")


# ============================================
# Configuration JWT
# ============================================
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = int(os.getenv("AMANE_JWT_EXPIRES_MINUTES", "60"))


def _resolve_secret() -> str:
    """Renvoie le secret JWT. Lit AMANE_JWT_SECRET, sinon en genere un ephemere."""
    secret = os.getenv("AMANE_JWT_SECRET")
    if secret and len(secret) >= 32:
        return secret
    if secret and len(secret) < 32:
        logger.warning(
            "AMANE_JWT_SECRET trop court (<32 chars) -> ignore. Generation d'un secret ephemere."
        )
    generated = secrets.token_urlsafe(48)
    logger.warning(
        "AMANE_JWT_SECRET non defini ou invalide. Secret ephemere genere : "
        "tous les tokens seront invalides au prochain redemarrage. "
        "Definissez AMANE_JWT_SECRET (>= 32 chars) en production."
    )
    return generated


JWT_SECRET = _resolve_secret()


# ============================================
# JWT helpers
# ============================================
def create_access_token(user_id: str, role: str, expires_minutes: Optional[int] = None) -> dict:
    """Cree un JWT signe et retourne (token, expires_at_iso)."""
    now = datetime.now(timezone.utc)
    expires_in = expires_minutes if expires_minutes is not None else JWT_EXPIRES_MINUTES
    expires_at = now + timedelta(minutes=expires_in)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {
        "token": token,
        "token_type": "Bearer",
        "expires_in": expires_in * 60,
        "expires_at": expires_at.isoformat(),
    }


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Token invalide ou expire : {type(e).__name__}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================
# Dependencies FastAPI
# ============================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Recupere l'utilisateur courant via le JWT (header `Authorization: Bearer ...`)."""
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentification requise (header Authorization: Bearer ...)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token mal forme (sub manquant)")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur inconnu ou desactive")
    return user


def require_role(*allowed_roles: str):
    """Factory de dependency : exige un des roles passes."""
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Acces reserve a : {', '.join(allowed_roles)}",
            )
        return current_user
    return checker


# ============================================
# Rate limiting (sliding window in-memory)
# ============================================
class _RateLimiter:
    def __init__(self, max_calls: int, period_sec: float):
        self.max_calls = max_calls
        self.period_sec = period_sec
        self._calls: dict[str, deque] = defaultdict(deque)

    def check(self, key: str) -> bool:
        now = time.time()
        q = self._calls[key]
        cutoff = now - self.period_sec
        while q and q[0] < cutoff:
            q.popleft()
        if len(q) >= self.max_calls:
            return False
        q.append(now)
        return True


_limiters = {
    "upload":   _RateLimiter(max_calls=30,  period_sec=60),    # 30 uploads / min / IP
    "login":    _RateLimiter(max_calls=10,  period_sec=60),    # 10 tentatives / min / IP
    "register": _RateLimiter(max_calls=5,   period_sec=300),   # 5 creations / 5 min / IP
    # Anti-enumeration : on capse les lectures de detail aussi (pas trop bas
    # pour ne pas bloquer un usage legitime medecin qui parcourt 100 cas).
    "read":     _RateLimiter(max_calls=120, period_sec=60),    # 120 lectures / min / IP
}


def get_client_ip(request: Optional[Request]) -> Optional[str]:
    """Extrait l'IP client réelle depuis X-Forwarded-For (proxy) ou client direct."""
    if request is None:
        return None
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def rate_limit(bucket: str):
    """Factory : usage `Depends(rate_limit("upload"))`."""
    if bucket not in _limiters:
        raise ValueError(f"Bucket inconnu : {bucket}")
    limiter = _limiters[bucket]

    def dep(request: Request) -> None:
        ip = get_client_ip(request)
        if not limiter.check(f"{bucket}:{ip}"):
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Trop de requetes. Limite : {limiter.max_calls} par "
                    f"{int(limiter.period_sec)}s."
                ),
                headers={"Retry-After": str(int(limiter.period_sec))},
            )

    return dep
