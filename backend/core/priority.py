"""
AMANE - Moteur de priorité multi-critères pour les caravanes médicales.

Score [0.0 – 1.0] combinant :
  1. Priorité médicale IA  (40%)  — risk_level + gemini_assessment
  2. Couverture santé       (30%)  — non assuré = plus vulnérable
  3. Zone géographique      (20%)  — rural = accès difficile
  4. Profil démographique   (10%)  — âges extrêmes plus vulnérables
"""

from __future__ import annotations

# ── Poids ────────────────────────────────────────────────────────────────────
W_MEDICAL  = 0.40
W_COVERAGE = 0.30
W_ZONE     = 0.20
W_DEMO     = 0.10

# ── Sous-scores médicaux ─────────────────────────────────────────────────────
RISK_SCORE = {"CRITICAL": 1.0, "HIGH": 0.8, "MEDIUM": 0.5, "LOW": 0.2}
GEMINI_BONUS = {"suspicious": 0.15, "atypical": 0.10, "non_lesion": 0.0, "benign": -0.05, "unclear": 0.0}

# ── Couverture santé ─────────────────────────────────────────────────────────
COVERAGE_SCORE = {
    "non_assure": 1.0,   # Aucune couverture → très vulnérable
    "ramed":      0.75,  # RAMED = personnes économiquement faibles
    "cnss":       0.30,  # Assuré salarié
    "mutuelle":   0.20,  # Bonne couverture
}

# ── Zone géographique ────────────────────────────────────────────────────────
ZONE_SCORE = {"rural": 1.0, "periurbain": 0.5, "urbain": 0.1}

# ── Démographie (âge) ────────────────────────────────────────────────────────
AGE_SCORE = {
    "0-5": 0.9, "5-12": 0.7, "75+": 0.9,
    "60-75": 0.6, "45-60": 0.4,
    "30-45": 0.3, "18-30": 0.2, "12-18": 0.3,
}


def compute_priority_score(
    risk_level: str | None,
    gemini_assessment: str | None,
    health_coverage: str | None,
    zone_type: str | None,
    age_range: str | None,
) -> float:
    """Retourne un score [0.0 – 1.0]. Plus élevé = caravane plus urgente."""

    # 1. Score médical
    medical = RISK_SCORE.get(risk_level or "", 0.3)
    medical += GEMINI_BONUS.get(gemini_assessment or "", 0.0)
    medical = max(0.0, min(1.0, medical))

    # 2. Couverture santé
    coverage = COVERAGE_SCORE.get(health_coverage or "", 0.5)

    # 3. Zone
    zone = ZONE_SCORE.get(zone_type or "", 0.5)

    # 4. Démographie
    demo = AGE_SCORE.get(age_range or "", 0.35)

    score = (
        W_MEDICAL  * medical  +
        W_COVERAGE * coverage +
        W_ZONE     * zone     +
        W_DEMO     * demo
    )
    return round(min(1.0, max(0.0, score)), 4)


def priority_label(score: float) -> str:
    if score >= 0.70:
        return "critique"
    if score >= 0.50:
        return "haute"
    if score >= 0.30:
        return "moyenne"
    return "basse"
