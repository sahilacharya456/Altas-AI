import { GoogleGenAI } from '@google/genai';
import type { z } from 'zod';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface GeminiRequest {
  systemInstruction: string;
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  responseMimeType?: string;
}

export interface GeminiResult {
  provider: 'gemini' | 'offline';
  text: string;
  offline: boolean;
}

const ai = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

export const hasGemini = Boolean(ai);

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const isTransientError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error);
  return /429|503|rate.limit|quota|overloaded|unavailable/i.test(msg);
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const generateGeminiText = async ({
  systemInstruction,
  prompt,
  maxOutputTokens = 600,
  temperature = 0.45,
  responseMimeType = 'application/json',
}: GeminiRequest): Promise<GeminiResult> => {
  if (!ai) {
    return { provider: 'offline', text: '', offline: true };
  }

  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await withTimeout(ai.models.generateContent({
        model: env.geminiModel,
        contents: prompt,
        config: {
          systemInstruction,
          maxOutputTokens,
          temperature,
          responseMimeType,
        },
      }), 18_000);

      return {
        provider: 'gemini',
        text: response.text?.trim() ?? '',
        offline: false,
      };
    } catch (error) {
      const transient = isTransientError(error);
      if (transient && attempt < MAX_ATTEMPTS) {
        const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        logger.warn('ai.gemini_retry', { attempt, delayMs, error: error instanceof Error ? error.message : String(error) });
        await sleep(delayMs);
        continue;
      }
      logger.warn('ai.gemini_failed', { attempt, error: error instanceof Error ? error.message : String(error) });
      return { provider: 'offline', text: '', offline: true };
    }
  }

  return { provider: 'offline', text: '', offline: true };
};

export const parseJsonFallback = <T>(raw: string, fallback: T): T => {
  try {
    const match = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) return fallback;
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
};

export const parseJsonWithSchema = <T>(
  raw: string,
  schema: z.ZodType<T>,
  fallback: T
): T => {
  try {
    const parsed = JSON.parse(raw);
    const checked = schema.safeParse(parsed);
    return checked.success ? checked.data : fallback;
  } catch {
    try {
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace < 0 || lastBrace <= firstBrace) return fallback;
      const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      const checked = schema.safeParse(parsed);
      return checked.success ? checked.data : fallback;
    } catch {
      return fallback;
    }
  }
};
