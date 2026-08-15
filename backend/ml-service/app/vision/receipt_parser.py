"""
Receipt / Expense Vision Parser

Extracts structured expense data from receipt OCR text:
  - merchant name
  - total amount (with currency detection)
  - date
  - expense category (food, transport, shopping, utilities, etc.)
  - line items (optional)

Returns a pre-filled expense object ready for one-tap confirmation
in the AltasAI Khata (finance) module.
"""
import re
from typing import Any

# ── Patterns ──────────────────────────────────────────────────────────────────

_TOTAL_RE = re.compile(
    r"\b(?:total|grand\s+total|amount\s+due|amount\s+paid|net\s+total|balance)\s*:?\s*"
    r"(?:rs\.?|pkr|usd|\$)?\s*([\d,]+(?:\.\d{1,2})?)",
    re.I,
)
_SUBTOTAL_RE = re.compile(
    r"\b(?:subtotal|sub\s+total)\s*:?\s*(?:rs\.?|pkr|usd|\$)?\s*([\d,]+(?:\.\d{1,2})?)",
    re.I,
)
_AMOUNT_FALLBACK_RE = re.compile(
    r"(?:rs\.?|pkr|usd|\$)\s*([\d,]+(?:\.\d{1,2})?)", re.I
)
_DATE_RE = re.compile(
    r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b"
)
_LINE_ITEM_RE = re.compile(
    r"^(.{3,40}?)\s{2,}(?:rs\.?|pkr)?\s*([\d,]+(?:\.\d{1,2})?)$",
    re.I | re.M,
)

# Category signals: category → keywords
_CATEGORY_SIGNALS: list[tuple[str, list[str]]] = [
    ("food",        ["restaurant", "cafe", "food", "meal", "pizza", "burger", "coffee", "tea", "bakery", "eat"]),
    ("transport",   ["uber", "careem", "taxi", "fuel", "petrol", "gas", "metro", "bus", "ride", "transport"]),
    ("shopping",    ["mart", "store", "shop", "clothes", "amazon", "daraz", "market", "superstore", "retail"]),
    ("utilities",   ["electric", "water", "gas", "internet", "wifi", "phone", "bill", "utility", "telecom"]),
    ("health",      ["pharmacy", "medicine", "clinic", "hospital", "doctor", "lab", "medical", "drugs"]),
    ("education",   ["school", "college", "university", "tuition", "course", "book", "stationery"]),
    ("entertainment", ["cinema", "movie", "netflix", "spotify", "game", "ticket", "event", "concert"]),
]


def _extract_merchant(lines: list[str]) -> str | None:
    """Merchant name is usually in the first 1–3 non-empty lines."""
    for line in lines[:3]:
        line = line.strip()
        # Skip lines that look like addresses, phone numbers, or dates
        if not line or len(line) < 3:
            continue
        if re.search(r"^\d|phone|tel:|www\.|@|\d{3,}", line, re.I):
            continue
        if len(line) <= 60:
            return line
    return None


def _infer_category(text: str) -> str:
    lower = text.lower()
    for category, signals in _CATEGORY_SIGNALS:
        if any(s in lower for s in signals):
            return category
    return "other"


def _extract_total(text: str) -> float | None:
    """Extract the total amount from receipt text."""
    m = _TOTAL_RE.search(text)
    if m:
        try:
            return float(m.group(1).replace(",", ""))
        except ValueError:
            pass
    # Fallback: subtotal
    m = _SUBTOTAL_RE.search(text)
    if m:
        try:
            return float(m.group(1).replace(",", ""))
        except ValueError:
            pass
    # Fallback: largest currency amount in the text
    amounts = []
    for m in _AMOUNT_FALLBACK_RE.finditer(text):
        try:
            amounts.append(float(m.group(1).replace(",", "")))
        except ValueError:
            pass
    return max(amounts) if amounts else None


def _extract_line_items(text: str) -> list[dict[str, Any]]:
    """Extract individual line items (item name + price)."""
    items = []
    for m in _LINE_ITEM_RE.finditer(text):
        name = m.group(1).strip()
        try:
            price = float(m.group(2).replace(",", ""))
        except ValueError:
            continue
        if len(name) >= 3 and price > 0:
            items.append({"name": name[:60], "price": price})
    return items[:15]


def parse_receipt(text: str) -> dict[str, Any]:
    """
    Parse OCR text from a receipt image into a structured expense object.

    Returns:
        {
          merchant, totalAmount, currency, date, category,
          lineItems, rawText, confidence
        }
    """
    if not text:
        return {"error": "No text provided", "confidence": 0.0}

    lines = [l.strip() for l in text.splitlines() if l.strip()]

    merchant = _extract_merchant(lines)
    total = _extract_total(text)
    category = _infer_category(text)
    line_items = _extract_line_items(text)

    # Currency detection
    currency = "PKR"
    if re.search(r"\busd\b|\$", text, re.I):
        currency = "USD"
    elif re.search(r"\beur\b|€", text, re.I):
        currency = "EUR"

    # Date extraction
    date_m = _DATE_RE.search(text)
    date_str = date_m.group(0) if date_m else None

    # Confidence: higher when we found both merchant + total
    confidence = 0.0
    if merchant:
        confidence += 0.35
    if total is not None:
        confidence += 0.45
    if date_str:
        confidence += 0.15
    confidence = round(min(0.95, confidence), 2)

    return {
        "merchant": merchant,
        "totalAmount": total,
        "currency": currency,
        "date": date_str,
        "category": category,
        "lineItems": line_items,
        "lineItemCount": len(line_items),
        "confidence": confidence,
        # Pre-filled Khata entry for one-tap logging
        "khataEntry": {
            "type": "expense",
            "title": f"{merchant or 'Expense'} receipt",
            "amount": total,
            "currency": currency,
            "category": category,
            "date": date_str,
            "notes": f"Scanned receipt — {len(line_items)} items",
        } if total is not None else None,
    }
