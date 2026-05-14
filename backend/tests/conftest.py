"""
Fixtures pytest pour AMANE.

- DB SQLite en mémoire (isolée par test, pas de fichier sur disque)
- AI moqué (pas de chargement du modèle 100MB pendant les tests)
- TestClient FastAPI avec override des dépendances
"""

from typing import Generator
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, get_db
from backend.core import ai_state


# ============================================
# DB en mémoire (un engine par session de test)
# ============================================
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


# ============================================
# Mock des modèles IA (évite le chargement torch)
# ============================================
@pytest.fixture(scope="session", autouse=True)
def mock_ai():
    """Remplace les singletons IA par des mocks pendant tous les tests."""
    mock_classifier = MagicMock()
    mock_classifier.predict.return_value = {
        "request_id": "REQ-TEST0001",
        "status": "success",
        "data": {
            "primary_diagnosis": "Naevus mélanocytaire",
            "confidence": 0.92,
            "risk_level": "LOW",
            "is_uncertain": False,
            "is_out_of_distribution": False,
            "entropy_normalized": 0.12,
            "alternatives": [{"label": "Mélanome", "score": 0.05}],
            "all_scores": {"nv": 0.92, "mel": 0.05},
            "metadata": {
                "model_version": "AMANE-ResNet18-v1.0",
                "latency_seconds": 0.3,
                "image_processed": "/tmp/test.jpg",
                "uncertainty_threshold": 0.60,
                "threshold_source": "test",
                "temperature": 1.0,
                "temperature_source": "test",
                "ood_max_prob_threshold": 0.50,
                "ood_entropy_threshold": 0.85,
            },
        },
    }

    mock_explainer = MagicMock()
    mock_explainer.generate_heatmap.return_value = {
        "heatmap_path": "/tmp/heatmap_test.jpg",
        "heatmap_filename": "heatmap_test.jpg",
        "bounding_box": {"x": 10, "y": 10, "width": 100, "height": 100},
        "max_activation": 0.9,
        "mean_activation": 0.4,
    }

    mock_gemini = MagicMock()
    mock_gemini.enabled = False
    mock_gemini.analyze.return_value = None

    ai_state.classifier = mock_classifier
    ai_state.explainer = mock_explainer
    ai_state.gemini = mock_gemini

    yield

    ai_state.classifier = None
    ai_state.explainer = None
    ai_state.gemini = None


# ============================================
# TestClient avec override DB
# ============================================
@pytest.fixture()
def client(db_session) -> Generator:
    from backend.main import app

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


# ============================================
# Utilisateurs de test
# ============================================
@pytest.fixture()
def admin_token(client) -> str:
    resp = client.post("/api/auth/login", json={
        "username": "admin_test",
        "password": "admin1234!",
    })
    if resp.status_code == 401:
        from passlib.context import CryptContext
        from backend.database import User
        from backend.tests.conftest import TestSessionLocal
        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
        with TestSessionLocal() as s:
            u = User(
                username="admin_test",
                password_hash=pwd.hash("admin1234!"),
                full_name="Admin Test",
                role="admin",
                verification_status="not_required",
            )
            s.add(u)
            s.commit()
        resp = client.post("/api/auth/login", json={
            "username": "admin_test",
            "password": "admin1234!",
        })
    return resp.json()["token"]


@pytest.fixture()
def medecin_token(client) -> str:
    client.post("/api/auth/register", json={
        "username": "medecin_test",
        "password": "medecin1234!",
        "full_name": "Dr Test",
        "role": "medecin",
        "credential_number": "CNOM-TEST-001",
    })
    from passlib.context import CryptContext
    from backend.database import User
    with TestSessionLocal() as s:
        u = s.query(User).filter(User.username == "medecin_test").first()
        if u:
            u.verification_status = "approved"
            s.commit()
    resp = client.post("/api/auth/login", json={
        "username": "medecin_test",
        "password": "medecin1234!",
    })
    return resp.json()["token"]
