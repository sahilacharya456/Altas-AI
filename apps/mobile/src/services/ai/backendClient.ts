import { getIdToken } from '../firebase/auth';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_ALTASAI_API_BASE_URL ||
  'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 20000;

export class BackendApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
  }
}

export const callBackend = async <TResponse>(
  path: string,
  body: Record<string, unknown> = {},
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
    if (error instanceof BackendApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BackendApiError('AltasAI backend request timed out.', 408);
    }
    throw new BackendApiError(error instanceof Error ? error.message : 'AltasAI backend request failed.');
  } finally {
    clearTimeout(timeout);
  }
};
