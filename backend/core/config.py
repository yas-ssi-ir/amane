"""
AMANE - Configuration centralisée (constantes, chemins, limites).
"""

import os
from typing import Literal

# Chemins de base
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
HEATMAP_DIR = os.path.join(UPLOAD_DIR, "heatmaps")
VIDEO_DIR = os.path.join(UPLOAD_DIR, "videos")
CREDENTIAL_DIR = os.path.join(UPLOAD_DIR, "credentials")

# Images de consultation
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP"}
EXT_FROM_FORMAT = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}

# Vidéo patient (facultative)
VIDEO_ALLOWED_MIME = {"video/mp4", "video/quicktime", "video/x-m4v", "video/x-matroska"}
VIDEO_MAX_BYTES = 80 * 1024 * 1024        # 80 MB

# Justificatifs professionnels
CREDENTIAL_ALLOWED_MIME = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
CREDENTIAL_MAX_BYTES = 10 * 1024 * 1024  # 10 MB

# Types Form (validation FastAPI)
GenderType = Literal["M", "F", "AUTRE"]
AgeRangeType = Literal["0-5", "5-12", "12-18", "18-30", "30-45", "45-60", "60-75", "75+"]
