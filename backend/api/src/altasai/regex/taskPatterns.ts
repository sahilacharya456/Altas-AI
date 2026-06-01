export const taskActionPatterns = {
  create: /\b(remind me to|add|create|schedule|put|make)\b/i,
  update: /\b(update|change|reschedule|move|edit)\b/i,
  delete: /\b(delete|remove|cancel)\b/i,
  complete: /\b(done|completed|finished|mark.*complete)\b/i,
};

export const taskTitlePattern = /\b(?:remind me to|add|create|schedule|finish|complete|make)\s+(.+?)(?:\s+(?:today|tomorrow|next week|at|by|before|with)\b|$)/i;
