import { getIdToken } from '../firebase/auth';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_ALTASAI_API_BASE_URL ||
  'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;

export class BackendApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
  }
}

const isRetryable = (error: unknown): boolean => {
  if (error instanceof BackendApiError) {
    if (!error.status) return true;
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }
  return true;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const callBackendGet = async <TResponse>(
  path: string,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<TResponse> => {
  const token = await getIdToken();
  if (!token) {
    throw new BackendApiError('You must be signed in before using AltasAI services.', 401);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || 'AltasAI backend request failed.';
      throw new BackendApiError(message, response.status);
    }
    return payload as TResponse;
  } catch (error) {
    if (error instanceof BackendApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BackendApiError('AltasAI backend request timed out.', 408);
    }
    throw new BackendApiError('AltasAI backend is not reachable.');
  } finally {
    clearTimeout(timeout);
  }
};

export const callBackend = async <TResponse>(
  path: string,
  body: Record<string, unknown> = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<TResponse> => {
  const token = await getIdToken();
  if (!token) {
    throw new BackendApiError('You must be signed in before using AltasAI services.', 401);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await delay(Math.min(1000 * 2 ** (attempt - 1), 4000));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.error?.message || 'AltasAI backend request failed.';
        throw new BackendApiError(message, response.status);
      }

      return payload as TResponse;
    } catch (error) {
      lastError = error;

      if (error instanceof BackendApiError) {
        if (!isRetryable(error)) throw error;
      } else if (error instanceof Error && error.name === 'AbortError') {
        lastError = new BackendApiError('AltasAI backend request timed out.', 408);
      } else {
        lastError = new BackendApiError(
          'AltasAI backend is not reachable. Start the backend with `npm run api`, then try again.'
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
};
