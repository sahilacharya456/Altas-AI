from fastapi import FastAPI

from app.api.routes_evaluate import router as evaluate_router
from app.api.routes_health import router as health_router
from app.api.routes_predict import router as predict_router
from app.api.routes_rag import router as rag_router
from app.api.routes_recommend import router as recommend_router
from app.api.routes_train import router as train_router
from app.api.routes_vision import router as vision_router
from app.core.trace_context import TraceContextMiddleware

app = FastAPI(title="AltasAI ML Service", version="0.1.0")

# Propagate x-trace-id from the Express API gateway through all ML service responses
app.add_middleware(TraceContextMiddleware)

app.include_router(health_router)
app.include_router(train_router)
app.include_router(predict_router)
app.include_router(rag_router)
app.include_router(recommend_router)
app.include_router(vision_router)
app.include_router(evaluate_router)

