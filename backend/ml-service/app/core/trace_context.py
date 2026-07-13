"""TraceContextMiddleware — lightweight x-trace-id propagation for FastAPI.

Reads the x-trace-id header from every inbound request (set by the Express
AltasAI API gateway) and:
  1. Stores it in request.state.trace_id for use in route handlers.
  2. Echoes it back in the response x-trace-id header.

This enables end-to-end distributed trace correlation:
  Mobile → Express (x-trace-id) → FastAPI ML service (x-trace-id) → logs

No external OpenTelemetry collector is required.
"""
from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class TraceContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        trace_id = (
            request.headers.get("x-trace-id")
            or request.headers.get("x-request-id")
            or ""
        )
        request.state.trace_id = trace_id

        response = await call_next(request)

        if trace_id:
            response.headers["x-trace-id"] = trace_id

        return response
