from app.vision.screenshot_analyzer import analyze_screenshot


def test_vision_adapter_uses_provided_ocr_text_and_reports_missing_provider():
    result = analyze_screenshot({"extractedText": "Schedule meeting tomorrow at 9"})
    assert result["extractedText"]
    assert result["confidence"] > 0

    missing = analyze_screenshot({"imageBase64": "fake"})
    assert missing["confidence"] == 0
    assert missing["limitations"]
