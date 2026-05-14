"""
AMANE - Analyseur Gemini multimodal (second avis IA).

Complemente le modele ResNet18 specialise (HAM10000) par une comprehension
contextuelle multimodale. Avantages :
  - Detecte naturellement les images hors-distribution (main, objet, peau saine)
    sans dependre d'un threshold d'entropie
  - Fournit une description en langage naturel exploitable par le medecin
  - Liste les signes ABCDE detectes (Asymetrie, Bord, Couleur, Diametre, Evolution)
  - Donne une recommandation d'action

Configuration via env :
  GEMINI_API_KEY : cle API Google AI Studio (https://aistudio.google.com/apikey)
  GEMINI_MODEL   : optionnel, defaut "gemini-2.0-flash"

Si la cle est absente ou la lib non installee, le module se desactive sans
casser le pipeline (graceful degradation).
"""

import os
import json
import logging
import time
from typing import Optional

from PIL import Image

logger = logging.getLogger("amane.gemini")


SYSTEM_PROMPT = """Tu es un assistant IA pour le dépistage dermatologique.

ATTENTION : tu n'es PAS un médecin. Ta sortie sert UNIQUEMENT à fournir un
second avis informatif au médecin spécialiste, qui prendra la décision finale.

Analyse l'image fournie et réponds UNIQUEMENT avec un JSON valide de cette forme :

{
  "description": "Description visuelle en français en 2-3 phrases. Mentionne couleur, forme, taille apparente, contours, symétrie.",
  "assessment": "benign | suspicious | atypical | unclear | non_lesion",
  "concerns": ["liste des signes médicaux spécifiques détectés, en français"],
  "recommended_action": "Action recommandée en français (1 phrase courte)"
}

Règles d'évaluation :
- "non_lesion" : l'image n'est PAS une lésion cutanée (main entière, visage, objet, peau saine sans lésion visible)
- "atypical"   : lésion inhabituelle, difficile à classer
- "suspicious" : signes ABCDE positifs (Asymétrie, Bord irrégulier, plusieurs Couleurs, Diamètre >6mm, Évolution apparente)
- "benign"     : lésion régulière, symétrique, couleur uniforme, contours nets
- "unclear"    : image floue, mal cadrée ou éclairage insuffisant

Sois CONSERVATEUR. En cas de doute entre benign et suspicious, choisis suspicious.

IMPORTANT : Réponds en JSON pur. Pas de \\`\\`\\`json, pas de markdown, pas d'explication avant ou après."""


VALID_ASSESSMENTS = {"benign", "suspicious", "atypical", "unclear", "non_lesion"}


class GeminiAnalyzer:
    """Analyseur Gemini pour second avis dermatologique."""

    def __init__(self):
        self.enabled = False
        self.client = None
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning(
                "GEMINI_API_KEY non defini. Gemini desactive (graceful degradation). "
                "Definir la cle dans .env pour activer le second avis IA."
            )
            print("   [WARN] Gemini desactive (GEMINI_API_KEY non defini)")
            return

        try:
            from google import genai
            self.client = genai.Client(api_key=api_key)
            self.enabled = True
            print(f"   [OK] Gemini analyzer charge ({self.model_name})")
        except ImportError:
            logger.warning("Package 'google-genai' non installe. pip install google-genai")
            print("   [WARN] Gemini desactive (package google-genai manquant)")
        except Exception as e:
            logger.warning(f"Init Gemini echouee : {e}")
            print(f"   [WARN] Gemini desactive (erreur init : {type(e).__name__})")

    def analyze(self, image_path: str) -> Optional[dict]:
        """Analyse une image et retourne un dict structure.

        Format de retour :
        {
            "description": "...",
            "assessment": "benign|suspicious|atypical|unclear|non_lesion",
            "concerns": ["..."],
            "recommended_action": "...",
            "model": "gemini-2.0-flash",
        }

        Renvoie None si Gemini est desactive ou en erreur (le pipeline continue).
        """
        if not self.enabled or not self.client:
            return None

        start = time.time()
        try:
            img = Image.open(image_path)

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[SYSTEM_PROMPT, img],
            )

            text = (response.text or "").strip()

            # Defense : strip ```json ... ``` si Gemini en met malgre la consigne
            if text.startswith("```"):
                lines = text.split("\n")
                # Retire la 1ere ligne (```json ou ```)
                if lines[0].startswith("```"):
                    lines = lines[1:]
                # Retire la derniere si c'est ```
                if lines and lines[-1].strip().startswith("```"):
                    lines = lines[:-1]
                text = "\n".join(lines).strip()

            data = json.loads(text)

            # Validation
            assessment = data.get("assessment", "unclear")
            if assessment not in VALID_ASSESSMENTS:
                logger.warning(f"Gemini assessment invalide : {assessment} -> unclear")
                assessment = "unclear"

            description = str(data.get("description", "")).strip()
            concerns = data.get("concerns", [])
            if not isinstance(concerns, list):
                concerns = []
            concerns = [str(c) for c in concerns][:10]  # cap a 10

            action = str(data.get("recommended_action", "")).strip()

            latency = round(time.time() - start, 3)
            logger.info("Gemini analyze ok (%.2fs, assessment=%s)", latency, assessment)

            return {
                "description": description,
                "assessment": assessment,
                "concerns": concerns,
                "recommended_action": action,
                "model": self.model_name,
                "latency_seconds": latency,
            }

        except json.JSONDecodeError as e:
            latency = round(time.time() - start, 3)
            logger.warning("Gemini reponse non-JSON (%.2fs) : %s", latency, e)
            return {
                "description": "Analyse Gemini disponible mais format de reponse inattendu.",
                "assessment": "unclear",
                "concerns": [],
                "recommended_action": "",
                "model": self.model_name,
                "latency_seconds": latency,
            }
        except Exception as e:
            latency = round(time.time() - start, 3)
            logger.warning(
                "Gemini analyze erreur (%.2fs) : %s : %s",
                latency, type(e).__name__, e,
            )
            return None


if __name__ == "__main__":
    # Test rapide
    import sys
    if len(sys.argv) < 2:
        print("Usage : python -m backend.ai.gemini_analyzer <image_path>")
        sys.exit(1)
    analyzer = GeminiAnalyzer()
    result = analyzer.analyze(sys.argv[1])
    print(json.dumps(result, indent=2, ensure_ascii=False))
