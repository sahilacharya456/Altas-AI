from app.evaluation.metrics import pass_result
from app.vision.screenshot_analyzer import analyze_screenshot


def evaluate() -> dict:
    result = analyze_screenshot({"extractedText": "Schedule: study at 9 and submit report tomorrow"})
    score = 1.0 if result["extractedText"] and result["confidence"] > 0 else 0.0
    return pass_result("vision_adapter", score, 0.8, result)
