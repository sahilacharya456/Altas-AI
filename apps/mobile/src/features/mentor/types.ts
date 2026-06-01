export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  offline?: boolean;
}

export interface MentorModeConfig {
  name: string;
  color: string;
}
