from fastapi import APIRouter

from app.evaluation.evaluation_runner import run_evaluation

router = APIRouter(prefix="/evaluate")


@router.post("/run")
def run() -> dict:
    return run_evaluation()
