import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';

// Initialize the official Google Gen AI SDK
export const genAI = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

// Configure standard chat model details
export const GEMINI_CONFIG = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxOutputTokens: 1000,
};
