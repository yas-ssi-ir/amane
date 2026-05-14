"""
AMANE - Singletons IA (chargés une seule fois au démarrage de l'app).

Pattern : module-level mutable globals.
  - main.py appelle init() au démarrage via lifespan.
  - Les routeurs importent le module et accèdent via ai_state.classifier, etc.
  - Pas d'import de valeur (from ai_state import classifier) car la valeur
    serait None au moment de l'import — on importe le module entier.
"""

import threading
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..ai.inference import AmaneClassifier
    from ..ai.explain import AmaneExplainer
    from ..ai.gemini_analyzer import GeminiAnalyzer

logger = logging.getLogger("amane")

classifier: "AmaneClassifier | None" = None
explainer: "AmaneExplainer | None" = None
gemini: "GeminiAnalyzer | None" = None
heatmap_lock = threading.Lock()


def init() -> None:
    """Charge les modèles IA. Appelé une seule fois depuis main.py lifespan."""
    global classifier, explainer, gemini

    # Imports tardifs pour éviter les imports circulaires et le chargement
    # des lourdes dépendances (torch) au démarrage si les modules sont importés
    # sans démarrer l'app (ex: tests, scripts).
    from ..ai.inference import AmaneClassifier
    from ..ai.explain import AmaneExplainer
    from ..ai.gemini_analyzer import GeminiAnalyzer

    logger.info("Chargement du modèle AMANE...")
    classifier = AmaneClassifier()
    explainer = AmaneExplainer(classifier.model)
    gemini = GeminiAnalyzer()
    logger.info("Modèle AMANE prêt.")
