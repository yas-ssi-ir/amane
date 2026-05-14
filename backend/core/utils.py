"""
AMANE - Utilitaires partagés (validation image, nettoyage fichiers).
"""

import logging
import os
from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from .config import (
    ALLOWED_IMAGE_MIMES, ALLOWED_PIL_FORMATS, EXT_FROM_FORMAT,
    MAX_IMAGE_SIZE_BYTES,
)

logger = logging.getLogger("amane")


async def read_and_validate_image(file: UploadFile) -> tuple[bytes, str]:
    """Lit le fichier en streaming avec limite de taille, valide le content-type
    déclaré puis vérifie le format réel via PIL (magic bytes).

    Retourne (content_bytes, extension_avec_point).
    Raise HTTPException 400/413/415 si invalide.
    """
    if file.content_type not in ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Format non supporté. Acceptés : JPEG, PNG, WEBP. "
                f"Reçu : {file.content_type or 'aucun'}"
            ),
        )

    content = bytearray()
    chunk_size = 1024 * 1024
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        content.extend(chunk)
        if len(content) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Fichier trop volumineux (max {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB).",
            )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide.")

    content_bytes = bytes(content)
    try:
        img = Image.open(BytesIO(content_bytes))
        fmt = img.format
        img.verify()
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError):
        raise HTTPException(status_code=400, detail="Fichier image invalide ou corrompu.")

    if fmt not in ALLOWED_PIL_FORMATS:
        raise HTTPException(
            status_code=415,
            detail=f"Format réel non supporté : {fmt}. Acceptés : JPEG, PNG, WEBP.",
        )

    return content_bytes, EXT_FROM_FORMAT[fmt]


def safe_remove(path: str) -> None:
    """Supprime un fichier sans propager d'exception (best-effort cleanup)."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError as e:
        logger.warning("Cleanup failed for %s: %s", path, e)
