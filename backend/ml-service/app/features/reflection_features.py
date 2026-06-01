from app.nlp.sentiment_emotion_model import analyze_reflection


def reflection_features(text: str) -> dict:
    return analyze_reflection(text)
