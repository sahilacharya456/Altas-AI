import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.ALTASAI_ML_SERVICE_BASE_URL || 'http://127.0.0.1:8001';

export const mlErrorRate = new Rate('altasai_ml_errors');

export const options = {
  scenarios: {
    ml_prediction_load: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 20),
      duration: __ENV.DURATION || '1m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    altasai_ml_errors: ['rate<0.01'],
  },
};

export default function () {
  const intent = http.post(`${BASE_URL}/predict/intent`, JSON.stringify({
    text: 'I keep delaying my work and need a focused plan for the next hour.',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const intentOk = check(intent, {
    'intent is 200': (res) => res.status === 200,
    'intent has label': (res) => {
      try {
        return typeof res.json('label') === 'string';
      } catch {
        return false;
      }
    },
  });
  mlErrorRate.add(!intentOk);

  const recommendation = http.post(`${BASE_URL}/recommend/action`, JSON.stringify({
    userId: 'load-test-user',
    context: {
      workloadScore: 82,
      stressSignal: 70,
      focusScore: 45,
      taskRiskScore: 75,
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const recommendationOk = check(recommendation, {
    'recommendation is 200': (res) => res.status === 200,
    'recommendation has top action': (res) => {
      try {
        return typeof res.json('topRecommendation') === 'string';
      } catch {
        return false;
      }
    },
  });
  mlErrorRate.add(!recommendationOk);

  sleep(1);
}
