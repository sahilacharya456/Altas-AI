from typing import Any
import re


def classify_safety(text: str) -> dict[str, Any]:
    lower = text.lower()
    if re.search(r"\b(hack|steal password|phish|bypass login|malware)\b", lower):
        return {"safetyLabel": "offensive_cybersecurity", "riskLevel": "critical", "allowedResponseType": "refusal", "refusalNeeded": True, "safeInstruction": "Refuse and redirect to defensive account safety.", "reason": "Offensive cybersecurity pattern."}
    if re.search(r"\b(diagnose|disease|prescribe|medical diagnosis)\b", lower):
        return {"safetyLabel": "medical_boundary", "riskLevel": "high", "allowedResponseType": "bounded_guidance", "refusalNeeded": False, "safeInstruction": "Do not diagnose; suggest qualified professional help for health concerns.", "reason": "Medical diagnosis boundary."}
    if re.search(r"\b(api key|password|otp|private key|token)\b", lower):
        return {"safetyLabel": "privacy_sensitive", "riskLevel": "medium", "allowedResponseType": "bounded_guidance", "refusalNeeded": False, "safeInstruction": "Do not repeat secrets; advise rotation and official recovery.", "reason": "Sensitive credential term."}
    if re.search(r"\b(kill myself|suicide|self harm|end my life)\b", lower):
        return {"safetyLabel": "crisis_language", "riskLevel": "critical", "allowedResponseType": "supportive_redirect", "refusalNeeded": False, "safeInstruction": "Prioritize immediate safety support and local emergency resources.", "reason": "Crisis-like language."}
    return {"safetyLabel": "allowed", "riskLevel": "low", "allowedResponseType": "normal", "refusalNeeded": False, "safeInstruction": "Normal AltasAI productivity guidance is allowed.", "reason": "No blocking safety pattern."}
