from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.vision.screenshot_analyzer import analyze_screenshot

router = APIRouter(prefix="/vision")


class VisionRequest(BaseModel):
    extractedText: str | None = None
    ocrText: str | None = None
    imageBase64: str | None = None
    imageUrl: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


@router.post("/analyze")
def analyze(request: VisionRequest) -> dict:
    return analyze_screenshot(request.model_dump())
