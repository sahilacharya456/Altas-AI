import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechModule {
  speak: (text: string, options?: Record<string, unknown>) => void;
  stop: () => void;
  getAvailableVoicesAsync: () => Promise<unknown[]>;
}

// expo-speech is listed in package.json. Run `npm install` to activate.
// Until then, all voice calls are no-ops (isSpeechAvailable stays false).
const Speech: SpeechModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-speech') as SpeechModule;
  } catch {
    return null;
  }
})();

type VoiceState = 'idle' | 'speaking';

const sanitizeForSpeech = (text: string): string =>
  text
    .replace(/\{[\s\S]*?\}/g, '')
    .replace(/[*_`#~>]/g, '')
    .replace(/→|•|━/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 500);

const VOICE_OPTIONS = { language: 'en-US', pitch: 0.95, rate: 0.92 };

export const useMentorVoice = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);
  const speakingTextRef = useRef('');

  useEffect(() => {
    if (!Speech) return;
    Speech.getAvailableVoicesAsync()
      .then((voices: unknown[]) => setIsSpeechAvailable(voices.length > 0))
      .catch(() => setIsSpeechAvailable(false));
    return () => { Speech?.stop(); };
  }, []);

  const speak = useCallback((text: string) => {
    if (!Speech || !isSpeechAvailable) return;
    const clean = sanitizeForSpeech(text);
    if (!clean) return;
    speakingTextRef.current = clean;
    Speech.stop();
    setVoiceState('speaking');
    Speech.speak(clean, {
      ...VOICE_OPTIONS,
      onDone: () => setVoiceState('idle'),
      onStopped: () => setVoiceState('idle'),
      onError: () => setVoiceState('idle'),
    });
  }, [isSpeechAvailable]);

  const stop = useCallback(() => {
    Speech?.stop();
    setVoiceState('idle');
  }, []);

  const toggle = useCallback((text: string) => {
    if (voiceState === 'speaking') { stop(); } else { speak(text); }
  }, [voiceState, speak, stop]);

  return {
    voiceState,
    isSpeechAvailable,
    speak,
    stop,
    toggle,
    isSpeaking: voiceState === 'speaking',
  };
};
