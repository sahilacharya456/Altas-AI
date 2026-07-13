export type ProductEventName =
  | 'onboarding_completed'
  | 'task_created'
  | 'task_completed'
  | 'focus_started'
  | 'focus_completed'
  | 'proof_submitted'
  | 'proof_verified'
  | 'proof_rejected'
  | 'proof_feed_published'
  | 'reflection_submitted'
  | 'mentor_prompt_submitted'
  | 'mentor_response_received'
  | 'mentor_fallback_used'
  | 'report_generated'
  | 'recommendation_accepted'
  | 'recommendation_ignored';

export interface ProductEventPayload {
  userId?: string;
  source?: string;
  value?: string | number | boolean;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ProductEvent {
  name: ProductEventName;
  createdAt: string;
  payload: ProductEventPayload;
}

const localEventBuffer: ProductEvent[] = [];

export const trackProductEvent = (name: ProductEventName, payload: ProductEventPayload = {}): ProductEvent => {
  const event = {
    name,
    createdAt: new Date().toISOString(),
    payload,
  };

  localEventBuffer.push(event);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.info('[AltasAI event]', event);
  }

  return event;
};

export const getBufferedProductEvents = (): ProductEvent[] => [...localEventBuffer];

export const clearBufferedProductEvents = () => {
  localEventBuffer.length = 0;
};
