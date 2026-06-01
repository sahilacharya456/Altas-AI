import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.ALTASAI_API_BASE_URL || 'http://127.0.0.1:3001';
const FIREBASE_ID_TOKEN = __ENV.ALTASAI_FIREBASE_ID_TOKEN;

export const errorRate = new Rate('altasai_backend_errors');
export const mentorLatency = new Trend('altasai_mentor_latency_ms');

export const options = {
  scenarios: {
    steady_backend_load: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 10),
      duration: __ENV.DURATION || '1m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    altasai_backend_errors: ['rate<0.01'],
    altasai_mentor_latency_ms: ['p(95)<2500'],
  },
};

const authedHeaders = () => {
  if (!FIREBASE_ID_TOKEN) {
    throw new Error('Set ALTASAI_FIREBASE_ID_TOKEN before running protected API load tests.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${FIREBASE_ID_TOKEN}`,
  };
};

export default function () {
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    'health is 200': (res) => res.status === 200,
    'health says ok': (res) => {
      try {
        return res.json('ok') === true;
      } catch {
        return false;
      }
    },
  });

  const mentor = http.post(`${BASE_URL}/api/mentor`, JSON.stringify({
    message: 'I feel overloaded. Give me one execution move.',
    contextType: 'general',
  }), { headers: authedHeaders() });
  mentorLatency.add(mentor.timings.duration);
  const mentorOk = check(mentor, {
    'mentor is 200': (res) => res.status === 200,
    'mentor has response': (res) => {
      try {
        return typeof res.json('response') === 'string';
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!mentorOk);

  const cortex = http.post(`${BASE_URL}/api/cortex`, JSON.stringify({ input: 'what should I do next?' }), {
    headers: authedHeaders(),
  });
  const cortexOk = check(cortex, {
    'cortex is 200': (res) => res.status === 200,
    'cortex returns state vector': (res) => {
      try {
        return Boolean(res.json('userStateVector'));
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!cortexOk);

  sleep(1);
}
