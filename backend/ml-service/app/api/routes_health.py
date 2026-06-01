import time

from fastapi import APIRouter, Response

router = APIRouter()
STARTED_AT = time.time()


@router.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "service": "altasai-ml-service",
        "uptimeSeconds": round(time.time() - STARTED_AT),
    }


@router.get("/metrics")
def metrics() -> Response:
    uptime = round(time.time() - STARTED_AT)
    body = "\n".join([
        "# HELP altasai_ml_uptime_seconds ML service uptime in seconds.",
        "# TYPE altasai_ml_uptime_seconds gauge",
        f"altasai_ml_uptime_seconds {uptime}",
        "# HELP altasai_ml_service_up ML service availability.",
        "# TYPE altasai_ml_service_up gauge",
        "altasai_ml_service_up 1",
        "",
    ])
    return Response(content=body, media_type="text/plain")
