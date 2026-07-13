export interface MentorAction {
  id: string;
  type: 'create_task' | 'create_behavior_event' | 'recommend_next_action';
  status: 'planned' | 'executed' | 'blocked';
  title: string;
  reason?: string;
  risk: 'low' | 'medium' | 'high';
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  offline?: boolean;
  actions?: MentorAction[];
}

export interface MentorModeConfig {
  name: string;
  color: string;
}
