"""UI translation service.

Translates batches of English UI strings into a target South African language
using the same Groq client that powers the voice assistant. The frontend caches
results in localStorage, so each unique string is only ever translated once per
language.
"""
import json
from typing import Dict, List

from django.conf import settings

from crm.services.assistant_service import get_groq_client, AssistantConfigError

__all__ = ["translate_batch", "AssistantConfigError"]

# Cap how many strings go in a single model call to keep latency/prompt sane.
MAX_BATCH = 80

_SYSTEM = (
    "You are a professional UI localiser for a South African wealth-management "
    "CRM. Translate short interface strings from English into {language}. "
    "Rules:\n"
    "- Return ONLY a JSON object mapping each original English string to its "
    "translation.\n"
    "- Keep the meaning and a professional, concise tone suitable for buttons, "
    "menus and labels.\n"
    "- Do NOT translate proper nouns (people, company and product names), "
    "reference codes (e.g. CLI-1024, FSP 29370), numbers, currency amounts or "
    "acronyms — leave them exactly as-is.\n"
    "- Preserve any leading/trailing punctuation and capitalisation style.\n"
    "- Every input string must appear as a key in the output, unchanged."
)


def _chunk(items: List[str], size: int):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def translate_batch(target_language: str, texts: List[str]) -> Dict[str, str]:
    """Translate a list of English strings into target_language.

    Returns a dict {original: translated}. Strings that could not be translated
    fall back to the original text.
    """
    unique = [t for t in dict.fromkeys(texts) if isinstance(t, str) and t.strip()]
    if not unique:
        return {}

    client = get_groq_client()
    model = getattr(settings, "GROQ_AGENT_MODEL", "openai/gpt-oss-120b")
    system = _SYSTEM.format(language=target_language)

    out: Dict[str, str] = {}
    for chunk in _chunk(unique, MAX_BATCH):
        payload = json.dumps({"strings": chunk}, ensure_ascii=False)
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {
                        "role": "user",
                        "content": (
                            "Translate every string in the 'strings' array. Respond with a "
                            "JSON object mapping each original string to its translation.\n"
                            + payload
                        ),
                    },
                ],
                temperature=0,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content or "{}"
            parsed = json.loads(content)
            # The model may nest under a key; normalise to a flat mapping.
            if isinstance(parsed, dict):
                mapping = parsed
                if len(parsed) == 1:
                    only_value = next(iter(parsed.values()))
                    if isinstance(only_value, dict):
                        mapping = only_value
                for original in chunk:
                    translated = mapping.get(original)
                    if isinstance(translated, str) and translated.strip():
                        out[original] = translated
                    # Missing keys are omitted on purpose so the client can retry.
        except Exception:
            # On failure, omit this chunk entirely; the client will retry it.
            continue

    return out
