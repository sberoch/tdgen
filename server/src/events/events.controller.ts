import { Controller, Req, UseGuards, Logger } from '@nestjs/common';
import { Sse } from '@nestjs/common';
import { Observable, Subject, merge, interval, finalize } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService } from './events.service';
import { Request } from 'express';
import { SamlUser } from '../auth/auth.service';

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private eventsService: EventsService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  stream(@Req() req: Request & { user: SamlUser }): Observable<MessageEvent> {
    const userId = req.user.id;
    this.logger.debug(`SSE connection request from user ${userId}`);

    const subject = new Subject<MessageEvent>();

    this.eventsService.addClient(userId, subject);

    // Heartbeat to keep connection alive (30 seconds)
    const heartbeat = interval(30000).pipe(
      map(
        () =>
          ({
            data: JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            }),
          }) as MessageEvent,
      ),
    );

    return merge(subject.asObservable(), heartbeat).pipe(
      finalize(() => {
        this.logger.debug(`SSE connection closed for user ${userId}`);
        this.eventsService.removeClient(userId);
      }),
    );
  }
}
