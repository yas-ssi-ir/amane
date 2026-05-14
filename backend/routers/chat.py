"""
AMANE - Routeur Chat IA
POST /api/chat — assistant médical conversationnel (Gemini + fallback local)
"""

import re as _re

from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool

from ..auth import get_current_user, rate_limit
from ..core import ai_state
from ..schemas import ChatRequest

router = APIRouter(prefix="/api", tags=["chat"])

# Prompt système de l'assistant
CHAT_SYSTEM = """Tu es l'assistant médical de l'application AMANE, spécialisé dans la santé cutanée au Maroc.
Réponds en français, arabe classique, ou darija marocaine selon la langue de l'utilisateur.
Explique simplement les maladies de peau, guide l'utilisation de l'app AMANE, rassure l'utilisateur.
NE remplace JAMAIS un diagnostic médical professionnel."""

# Règles de fallback multilingue (quand Gemini est indisponible)
_FALLBACK_RULES: list[tuple[str, dict]] = [
    (r"(bonjour|bonsoir|salut|hello|salam|مرحبا|السلام|labas|lbas|ahlan|hi\b)",
     {
         'fr': "Bonjour ! Je suis l'assistant médical AMANE. Je peux vous aider avec les maladies de peau et l'utilisation de l'application. Que puis-je faire pour vous ?",
         'ar': "مرحباً! أنا المساعد الطبي لتطبيق AMANE. يمكنني مساعدتك في أمراض الجلد واستخدام التطبيق. كيف يمكنني مساعدتك؟",
         'darija': "Salam! Ana l'assistant tibbi dyal AMANE. Imken n3awnak f amrad jeld o kifach tst3mel l'application. Chno bgha?",
     }),
    (r"(eczéma|eczema|dermatite|démangeaison|prurit|حكة|التهاب الجلد|jeld 7kk)",
     {
         'fr': "L'eczéma est une inflammation cutanée causant des démangeaisons et rougeurs. Conseils : hydratez la peau quotidiennement, évitez savons forts et synthétiques, consultez un médecin pour un traitement adapté. AMANE peut analyser vos lésions.",
         'ar': "الإكزيما التهاب جلدي يسبب حكة واحمراراً. رطّب الجلد يومياً، تجنب الصابون القوي، استشر طبيباً. يمكن لـ AMANE تحليل الآفات.",
         'darija': "L'eczéma hwa iltihabd f jeld. Nchaych: lli jeld dyalk, b3d 3la savon qwi, chouf tabib.",
     }),
    (r"(acné|bouton|point noir|comedón|comédon|حب الشباب|بثور)",
     {
         'fr': "L'acné est causée par l'obstruction des pores. Nettoyez votre visage deux fois par jour avec un gel doux, évitez de toucher les boutons. En cas d'acné sévère, consultez un dermatologue.",
         'ar': "حب الشباب ينتج عن انسداد المسام. اغسل وجهك مرتين يومياً، لا تلمس الحبوب. في الحالات الشديدة استشر طبيب جلدية.",
         'darija': "L'acné katkoun b sabab sdoud lmsam. Ghasel wjhek mrtin f nhar, matmssech boutons.",
     }),
    (r"(mélanome|grain de beauté|naevus|tache suspecte|cancer|ورم|سرطان|شامة)",
     {
         'fr': "⚠️ Consultez un médecin rapidement si une lésion change de taille/couleur, a des bords irréguliers, saigne ou dépasse 6 mm. Règle ABCDE. AMANE peut analyser la lésion pour un premier avis.",
         'ar': "⚠️ استشر طبيباً فوراً إذا تغيّرت الآفة حجماً أو لوناً، أو نزفت. يمكن لـ AMANE تحليل الآفة.",
         'darija': "⚠️ Chouf tabib b sr3a ila lésion tbdlat. AMANE imken ychlel lésion dyalk.",
     }),
    (r"(urgence|grave|danger|sang|saign|brûlure|مستعجل|خطر|نزيف)",
     {
         'fr': "⚠️ Si la lésion saigne abondamment, s'étend rapidement ou cause de la fièvre — consultez immédiatement un médecin ou appelez le 141 (SAMU Maroc).",
         'ar': "⚠️ إذا نزفت الآفة أو امتدت بسرعة — اتصل فوراً بـ 141 (إسعاف المغرب).",
         'darija': "⚠️ Ila lésion dat ddam aw tat7d b sr3a — tléfon l 141 daba.",
     }),
    (r"(photo|analyser|analyse|prendre|image|scanner|تحليل|صورة)",
     {
         'fr': "Pour analyser une lésion : appuyez sur ＋, prenez une photo nette à 15–20 cm, remplissez les infos et soumettez. L'IA analyse en quelques secondes.",
         'ar': "لتحليل آفة: اضغط ＋، صورة واضحة من 15-20 سم، أدخل البيانات وأرسل.",
         'darija': "Bach tchlel: zid 3la ＋, photo wadi7a, 3mmer info o t3ba.",
     }),
    (r"(merci|shukran|شكرا|choukran)",
     {
         'fr': "De rien ! N'hésitez pas si vous avez d'autres questions.",
         'ar': "على الرحب والسعة! لا تتردد إذا كان لديك أسئلة.",
         'darija': "Machi moushkil! Ila 3ndak chi so2al kher, ana hna.",
     }),
]

_DARIJA_MARKERS = _re.compile(
    r'\b(labas|lbas|wach|machi|bghit|kayn|ma3|hna|dyal|daba|bzzaf|mezyan|chno|'
    r'3lach|kifach|nta|nti|ndir|walo|fhmt|kolchi|lgha|tabib|tchlel|katbin|'
    r'kaydwi|katdwi|mrid|ghasel|matmss|chouf|zid|t3ba|ywsl|yakhd|sri3|jeld)\b',
    _re.IGNORECASE,
)


def _detect_lang(message: str) -> str:
    if _DARIJA_MARKERS.search(message):
        return 'darija'
    arabic_chars = sum(1 for c in message if '؀' <= c <= 'ۿ')
    if arabic_chars > max(2, len(message) * 0.15):
        return 'ar'
    return 'fr'


def _fallback_response(message: str) -> str:
    lang = _detect_lang(message)
    for pattern, responses in _FALLBACK_RULES:
        if _re.search(pattern, message, _re.IGNORECASE):
            return responses.get(lang, responses['fr'])
    defaults = {
        'fr': "Je suis l'assistant AMANE, spécialisé en santé cutanée. Posez-moi des questions sur les maladies de peau ou l'utilisation de l'application.",
        'ar': "أنا مساعد AMANE المتخصص في صحة الجلد. اسألني عن أمراض الجلد أو كيفية استخدام التطبيق.",
        'darija': "Ana assistant AMANE, mutakhasis f s7a dial jeld. Wejihi liya as2ila 3la amrad jeld aw 3la l'application.",
    }
    return defaults[lang]


@router.post("/chat", dependencies=[Depends(rate_limit("read"))])
async def chat(req: ChatRequest, current_user=Depends(get_current_user)):
    """Assistant IA conversationnel — Gemini avec fallback local multilingue."""
    gemini = ai_state.gemini
    if gemini and gemini.enabled and gemini.client is not None:
        try:
            history = [
                {
                    "role": ("model" if m.role == "assistant" else "user"),
                    "parts": [{"text": m.content}],
                }
                for m in req.messages
            ]
            contents = history + [{"role": "user", "parts": [{"text": req.message}]}]

            from google.genai import types as genai_types

            config = genai_types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM,
                temperature=0.7,
                max_output_tokens=512,
            )
            response = await run_in_threadpool(
                lambda: gemini.client.models.generate_content(
                    model=gemini.model_name,
                    contents=contents,
                    config=config,
                )
            )
            if response.text:
                return {"reply": response.text}
        except Exception as e:
            msg = str(e)
            if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                pass  # quota — fallback silencieux
            else:
                import logging
                logging.getLogger("amane").error("Chat IA erreur: %s", e)

    return {"reply": _fallback_response(req.message)}
