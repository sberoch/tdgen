import { Subject } from 'rxjs';

export type EventType =
  // JobTask events
  | 'job-task:created'
  | 'job-task:updated'
  | 'job-task:deleted'
  | 'job-task:restored'
  | 'job-task:permanent-deleted'

  // JobDescription events
  | 'job-description:created'
  | 'job-description:updated'
  | 'job-description:deleted'
  | 'job-description:restored'
  | 'job-description:permanent-deleted'

  // JobDescriptionTask events (task-to-description associations)
  | 'job-description-task:created'
  | 'job-description-task:updated'
  | 'job-description-task:deleted'
  | 'job-description-task:reordered'
  | 'job-description-task:percentage-changed'

  // Lock events
  | 'lock:acquired'
  | 'lock:released'
  | 'lock:broken';

export interface SseEvent {
  type: EventType;
  data: any;
  userId?: string;
  timestamp: string;
}

export interface ClientConnection {
  userId: string;
  subject: Subject<MessageEvent>;
  connectedAt: Date;
}
