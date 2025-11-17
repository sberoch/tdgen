import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

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
  | 'lock:expired'
  | 'lock:broken'
  | 'lock:refreshed';

export interface SseEvent {
  type: EventType;
  data: any;
  userId?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class SseService {
  private eventSource: EventSource | null = null;
  private reconnectTimer: any;

  // Event subjects for different event types
  private lockEvents$ = new Subject<SseEvent>();
  private jobTaskEvents$ = new Subject<SseEvent>();
  private jobDescriptionEvents$ = new Subject<SseEvent>();
  private jobDescriptionTaskEvents$ = new Subject<SseEvent>();

  // Connection state
  private connectionState$ = new BehaviorSubject<
    'connected' | 'disconnected' | 'reconnecting'
  >('disconnected');

  constructor(private ngZone: NgZone) {}

  // Public observables
  get lockEvents(): Observable<SseEvent> {
    return this.lockEvents$.asObservable();
  }

  get jobTaskEvents(): Observable<SseEvent> {
    return this.jobTaskEvents$.asObservable();
  }

  get jobDescriptionEvents(): Observable<SseEvent> {
    return this.jobDescriptionEvents$.asObservable();
  }

  get jobDescriptionTaskEvents(): Observable<SseEvent> {
    return this.jobDescriptionTaskEvents$.asObservable();
  }

  get connectionState(): Observable<string> {
    return this.connectionState$.asObservable();
  }

  /**
   * Establish SSE connection
   */
  connect(): void {
    if (this.eventSource) {
      return; // Already connected
    }

    const url = `/api/events/stream`;
    console.log('Connecting to SSE stream...');

    this.eventSource = new EventSource(url, { withCredentials: true });

    this.eventSource.onopen = () => {
      console.log('SSE connection established');
      this.connectionState$.next('connected');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.eventSource.onmessage = (event: MessageEvent) => {
      this.ngZone.run(() => {
        this.handleMessage(event);
      });
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.connectionState$.next('disconnected');
      this.eventSource?.close();
      this.eventSource = null;
      this.reconnect();
    };
  }

  /**
   * Disconnect SSE connection
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectionState$.next('disconnected');
      console.log('SSE connection closed');
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Attempt to reconnect after delay
   */
  private reconnect(): void {
    this.connectionState$.next('reconnecting');
    console.log('SSE reconnect scheduled in 5 seconds...');
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect SSE...');
      this.connect();
    }, 5000); // 5 seconds
  }

  /**
   * Handle incoming SSE message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const rawEvent = JSON.parse(event.data);
      if (rawEvent.type === 'heartbeat') {
        return;
      }

      const sseEvent: SseEvent = rawEvent as SseEvent;
      this.routeEvent(sseEvent);
    } catch (error) {
      console.error('Error parsing SSE event:', error);
    }
  }

  /**
   * Route event to appropriate subject based on event type
   */
  private routeEvent(sseEvent: SseEvent): void {
    const eventType = sseEvent.type;
    console.log('[DEV] Receiving event:', sseEvent);

    if (eventType.startsWith('lock:')) {
      this.lockEvents$.next(sseEvent);
    } else if (eventType.startsWith('job-task:')) {
      this.jobTaskEvents$.next(sseEvent);
    } else if (eventType.startsWith('job-description:')) {
      this.jobDescriptionEvents$.next(sseEvent);
    } else if (eventType.startsWith('job-description-task:')) {
      this.jobDescriptionTaskEvents$.next(sseEvent);
    }
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.disconnect();
    this.lockEvents$.complete();
    this.jobTaskEvents$.complete();
    this.jobDescriptionEvents$.complete();
    this.jobDescriptionTaskEvents$.complete();
    this.connectionState$.complete();
  }
}
