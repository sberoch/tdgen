import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: string;
  data: any;
  userId?: string;
  timestamp: string;
}

interface ClientConnection {
  userId: string;
  subject: Subject<MessageEvent>;
  connectedAt: Date;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private clients = new Map<string, ClientConnection>();

  /**
   * Add a client connection
   */
  addClient(userId: string, subject: Subject<MessageEvent>): void {
    this.clients.set(userId, {
      userId,
      subject,
      connectedAt: new Date(),
    });
    this.logger.debug(
      `Client ${userId} connected. Total clients: ${this.clients.size}`,
    );
  }

  /**
   * Remove a client connection
   */
  removeClient(userId: string): void {
    this.clients.delete(userId);
    this.logger.debug(
      `Client ${userId} disconnected. Total clients: ${this.clients.size}`,
    );
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcastEvent(event: SseEvent): void {
    const messageEvent: MessageEvent = {
      data: JSON.stringify(event),
    } as MessageEvent;

    let successCount = 0;
    this.clients.forEach((client) => {
      try {
        client.subject.next(messageEvent);
        successCount++;
      } catch (error) {
        this.logger.error(
          `Failed to send event to client ${client.userId}`,
          error,
        );
      }
    });

    this.logger.debug(
      `Event ${event.type} broadcasted to ${successCount}/${this.clients.size} clients`,
    );
  }

  /**
   * Get list of active users
   */
  getActiveUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Get total connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
