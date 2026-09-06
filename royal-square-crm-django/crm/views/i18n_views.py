from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import JSONParser

from crm.services.i18n_service import translate_batch, AssistantConfigError

# Hard cap to protect the endpoint from oversized payloads.
MAX_TEXTS = 400


class TranslateView(APIView):
    """Batch-translate UI strings into a target language.

    Body: { "target": "isiZulu", "texts": ["Dashboard", "Clients", ...] }
    Returns: { "target": "isiZulu", "translations": { "Dashboard": "...", ... } }
    """
    parser_classes = [JSONParser]

    def post(self, request):
        target = (request.data.get("target") or "").strip()
        texts = request.data.get("texts") or []

        if not target:
            return Response({"detail": "A 'target' language is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(texts, list):
            return Response({"detail": "'texts' must be a list of strings."}, status=status.HTTP_400_BAD_REQUEST)
        if len(texts) > MAX_TEXTS:
            texts = texts[:MAX_TEXTS]

        # English is the source language — nothing to translate.
        if target.strip().lower() in ("english", "en", "en-za"):
            return Response({"target": target, "translations": {t: t for t in texts if isinstance(t, str)}},
                            status=status.HTTP_200_OK)

        try:
            translations = translate_batch(target, texts)
        except AssistantConfigError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            return Response({"detail": f"Translation error: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"target": target, "translations": translations}, status=status.HTTP_200_OK)
