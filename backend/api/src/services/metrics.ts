import type { Request, Response } from 'express';

interface RouteMetric {
  count: number;
  errors: number;
  totalDurationMs: number;
  maxDurationMs: number;
}

const startedAt = Date.now();
const routeMetrics = new Map<string, RouteMetric>();
const statusCounts = new Map<number, number>();

const routeKey = (req: Request) => `${req.method} ${req.route?.path ?? req.path}`;

export const observeHttpRequest = (req: Request, res: Response, durationMs: number) => {
  const key = routeKey(req);
  const metric = routeMetrics.get(key) ?? {
    count: 0,
    errors: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
  };

  metric.count += 1;
  metric.errors += res.statusCode >= 500 ? 1 : 0;
  metric.totalDurationMs += durationMs;
  metric.maxDurationMs = Math.max(metric.maxDurationMs, durationMs);
  routeMetrics.set(key, metric);
  statusCounts.set(res.statusCode, (statusCounts.get(res.statusCode) ?? 0) + 1);
};

export const getMetricsSnapshot = () => {
  const routes = Array.from(routeMetrics.entries()).map(([route, metric]) => ({
    route,
    ...metric,
    avgDurationMs: metric.count > 0 ? Math.round(metric.totalDurationMs / metric.count) : 0,
    errorRate: metric.count > 0 ? metric.errors / metric.count : 0,
  }));

  return {
    service: 'altasai-backend',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    totalRequests: routes.reduce((sum, item) => sum + item.count, 0),
    totalErrors: routes.reduce((sum, item) => sum + item.errors, 0),
    routes,
    statusCounts: Object.fromEntries(statusCounts.entries()),
    memory: process.memoryUsage(),
  };
};

export const renderPrometheusMetrics = () => {
  const snapshot = getMetricsSnapshot();
  const lines = [
    '# HELP altasai_uptime_seconds Backend process uptime in seconds.',
    '# TYPE altasai_uptime_seconds gauge',
    `altasai_uptime_seconds ${snapshot.uptimeSeconds}`,
    '# HELP altasai_http_requests_total Total HTTP requests by route.',
    '# TYPE altasai_http_requests_total counter',
  ];

  for (const route of snapshot.routes) {
    const label = route.route.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`altasai_http_requests_total{route="${label}"} ${route.count}`);
    lines.push(`altasai_http_request_errors_total{route="${label}"} ${route.errors}`);
    lines.push(`altasai_http_request_duration_avg_ms{route="${label}"} ${route.avgDurationMs}`);
    lines.push(`altasai_http_request_duration_max_ms{route="${label}"} ${route.maxDurationMs}`);
  }

  lines.push('# HELP altasai_memory_heap_used_bytes Node heap used bytes.');
  lines.push('# TYPE altasai_memory_heap_used_bytes gauge');
  lines.push(`altasai_memory_heap_used_bytes ${snapshot.memory.heapUsed}`);
  return `${lines.join('\n')}\n`;
};

export const renderAdminStatsHtml = () => {
  const snapshot = getMetricsSnapshot();
  const rows = snapshot.routes.map((route) => `
    <tr>
      <td>${route.route}</td>
      <td>${route.count}</td>
      <td>${route.errors}</td>
      <td>${route.avgDurationMs}</td>
      <td>${route.maxDurationMs}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AltasAI Admin Stats</title>
  <style>
    body { margin: 0; background: #070a0f; color: #e5edf7; font-family: Arial, sans-serif; }
    main { max-width: 980px; margin: 0 auto; padding: 32px; }
    h1 { margin: 0 0 8px; }
    .muted { color: #8b9bb0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 24px 0; }
    .card { border: 1px solid #1f2a3a; background: #0e141d; border-radius: 8px; padding: 16px; }
    .value { font-size: 28px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #1f2a3a; }
    th, td { padding: 10px; border-bottom: 1px solid #1f2a3a; text-align: left; }
    th { color: #7dd3fc; background: #0e141d; }
  </style>
</head>
<body>
  <main>
    <p class="muted">AltasAI production monitoring</p>
    <h1>Backend Stats</h1>
    <p class="muted">This page is runtime-only and must be protected at the deployment edge before public launch.</p>
    <section class="grid">
      <div class="card"><div class="muted">Uptime</div><div class="value">${snapshot.uptimeSeconds}s</div></div>
      <div class="card"><div class="muted">Requests</div><div class="value">${snapshot.totalRequests}</div></div>
      <div class="card"><div class="muted">Errors</div><div class="value">${snapshot.totalErrors}</div></div>
      <div class="card"><div class="muted">Heap Used</div><div class="value">${Math.round(snapshot.memory.heapUsed / 1024 / 1024)}MB</div></div>
    </section>
    <table>
      <thead><tr><th>Route</th><th>Count</th><th>Errors</th><th>Avg ms</th><th>Max ms</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>`;
};
