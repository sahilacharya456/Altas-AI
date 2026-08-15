"""
OCR Adapter — routes image text extraction to the best available backend:
  1. Gemini Vision (gemini-1.5-flash) — if GEMINI_API_KEY is configured and a base64 image is provided.
  2. Pre-extracted text — if the caller provides extractedText/ocrText in the payload.
  3. Not configured — returns empty string with guidance.
"""
import base64
import os
from typing import Any

_GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")


def _extract_via_gemini(image_b64: str, image_mime: str = "image/jpeg") -> dict[str, Any]:
    """Send image to Gemini Vision and return extracted text."""
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=_GEMINI_KEY)
        model = genai.GenerativeModel(_GEMINI_MODEL)
        image_data = {"mime_type": image_mime, "data": image_b64}
        prompt = (
            "Extract ALL text from this image exactly as it appears. "
            "Preserve structure (lists, tables, line breaks). "
            "Output only the extracted text — no commentary, no markdown wrappers."
        )
        response = model.generate_content([prompt, image_data])
        text = response.text.strip() if response.text else ""
        return {
            "extractedText": text,
            "provider": "gemini_vision",
            "confidence": 0.92 if text else 0.0,
            "limitations": [] if text else ["Gemini Vision returned empty text — image may be unreadable."],
        }
    except Exception as exc:
        return {
            "extractedText": "",
            "provider": "gemini_vision_failed",
            "confidence": 0.0,
            "limitations": [f"Gemini Vision error: {exc}"],
        }


def extract_text(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Extract text from an image or accept pre-extracted text.

    Payload keys (in priority order):
      imageBase64 — base64-encoded image string
      imageMime   — MIME type of the image (default: image/jpeg)
      extractedText / ocrText — pre-extracted text (skips vision model)
    """
    # Priority 1: pre-extracted text from caller
    provided = payload.get("extractedText") or payload.get("ocrText")
    if provided:
        return {
            "extractedText": str(provided).strip(),
            "provider": "provided_ocr_text",
            "confidence": 0.85,
            "limitations": [],
        }

    # Priority 2: Gemini Vision
    image_b64 = payload.get("imageBase64", "")
    if image_b64 and _GEMINI_KEY:
        image_mime = payload.get("imageMime", "image/jpeg")
        return _extract_via_gemini(image_b64, image_mime)

    # Priority 3: not configured
    return {
        "extractedText": "",
        "provider": "not_configured",
        "confidence": 0.0,
        "limitations": [
            "No image or text provided.",
            "Pass imageBase64 + GEMINI_API_KEY for vision, or pass extractedText directly.",
        ],
    }

