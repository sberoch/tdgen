# Server-Sent Events (SSE) Implementation Plan

## Overview

Implement Server-Sent Events to enable real-time collaboration features in TDGen, allowing multiple users to see changes instantly including:

- Lock acquisition/release
- Task and description CRUD operations
- Workspace changes
- User presence indicators

This builds on the existing pessimistic locking implementation to provide a truly collaborative experience.

---

## Architecture Design

### Event-Driven Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  User Actions   │ ──HTTP─→│  NestJS Backend  │ ──SSE──→│  All Clients    │
│  (CRUD/Locks)   │         │  (Event Emitter) │         │  (Broadcast)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                            Event Broadcasting
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ Client A │    │ Client B │    │ Client C │
              └──────────┘    └──────────┘    └──────────┘

```

### Technology Stack

**Backend**:

- NestJS SSE support (built-in via `@Sse()` decorator)
- RxJS Subjects for event broadcasting
- Existing JWT authentication for SSE endpoint

**Frontend**:

- Native EventSource API
- RxJS for event stream processing
- Integration with existing BehaviorSubject-based services

---

## Backend Implementation

### 1. Create Events Module

**File**: `server/src/events/events.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService], // Export to use in other modules
})
export class EventsModule {}
```

**Register in AppModule**:

```typescript
@Module({
  imports: [
    // ... existing imports
    EventsModule,
  ],
})
export class AppModule {}
```

---

### 2. Create Events Service

**File**: `server/src/events/events.service.ts`

Core service for managing SSE connections and broadcasting events.

**Key Features**:

- Track active client connections with metadata (userId)
- Broadcast all events to all connected clients
- Handle client connection/disconnection
- Provide event emission methods for all entity types

**Event Types**:

```typescript
type EventType =
  // JobTask events
  | "job-task:created"
  | "job-task:updated"
  | "job-task:deleted"
  | "job-task:restored"

  // JobDescription events
  | "job-description:created"
  | "job-description:updated"
  | "job-description:deleted"
  | "job-description:restored"

  // JobDescriptionTask events (task-to-description associations)
  | "job-description-task:created"
  | "job-description-task:updated"
  | "job-description-task:deleted"
  | "job-description-task:reordered"
  | "job-description-task:percentage-changed"

  // Lock events
  | "lock:acquired"
  | "lock:released"
  | "lock:expired"
  | "lock:broken"
  | "lock:refreshed"

  // User presence events
  | "user:joined-workspace"
  | "user:left-workspace";

interface SseEvent {
  type: EventType;
  data: any;
  userId?: string; // User who triggered the event
  timestamp: string;
}
```

**Client Connection Tracking**:

```typescript
interface ClientConnection {
  userId: string;
  subject: Subject<MessageEvent>;
  connectedAt: Date;
}
```

**Core Methods**:

- `addClient(userId: string, subject: Subject<MessageEvent>): void`
- `removeClient(userId: string): void`
- `broadcastEvent(event: SseEvent): void`
- `getActiveUsers(): string[]`

**Implementation Details**:

- Use `Map<string, ClientConnection>` to track clients
- Use RxJS `Subject<MessageEvent>` for each client
- Broadcast all events to all connected clients
- Log connection events for debugging
- Clean up on disconnection

---

### 3. Create Events Controller

**File**: `server/src/events/events.controller.ts`

Expose SSE endpoint with JWT authentication.

**Endpoint**: `GET /api/events/stream`

**Features**:

- Protected by `@UseGuards(JwtAuthGuard)`
- Returns Observable of MessageEvent
- Extracts user from JWT payload
- Registers client with EventsService
- Sends heartbeat every 30 seconds (keep-alive)
- Handles cleanup on disconnect

**Implementation**:

```typescript
@Controller("events")
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Sse("stream")
  @UseGuards(JwtAuthGuard)
  stream(@Req() req): Observable<MessageEvent> {
    const userId = req.user.sub; // From JWT payload

    const subject = new Subject<MessageEvent>();

    this.eventsService.addClient(userId, subject);

    // Heartbeat to keep connection alive
    const heartbeat = interval(30000).pipe(
      map(() => ({ data: { type: "heartbeat" } }))
    );

    return merge(subject.asObservable(), heartbeat).pipe(
      finalize(() => this.eventsService.removeClient(userId))
    );
  }
}
```

---

### 4. Integrate Event Emission into Existing Services

Inject `EventsService` into existing services and emit events after mutations.

#### 4.1 JobTasksService Integration

**File**: `server/src/job-tasks/job-tasks.service.ts`

**Changes**:

```typescript
constructor(
  private prisma: PrismaService,
  private eventsService: EventsService, // Inject EventsService
) {}

async create(data: CreateJobTaskDto, userId: string): Promise<JobTask> {
  const jobTask = await this.prisma.jobTask.create({ /* ... */ });

  // Emit event
  this.eventsService.broadcastEvent({
    type: 'job-task:created',
    data: jobTask,
    userId,
    timestamp: new Date().toISOString(),
  });

  return jobTask;
}

async set(id: number, data: UpdateJobTaskDto, userId: string): Promise<JobTask> {
  const jobTask = await this.prisma.jobTask.update({ /* ... */ });

  // Emit event
  this.eventsService.broadcastEvent({
    type: 'job-task:updated',
    data: jobTask,
    userId,
    timestamp: new Date().toISOString(),
  });

  return jobTask;
}

async delete(id: number, userId: string): Promise<void> {
  await this.prisma.jobTask.update({ /* ... */ });

  // Emit event
  this.eventsService.broadcastEvent({
    type: 'job-task:deleted',
    data: { id },
    userId,
    timestamp: new Date().toISOString(),
  });
}

// Similar for restore(), permanentDeleteWithCleanup()
```

**Import EventsModule** in `JobTasksModule`:

```typescript
@Module({
  imports: [EventsModule],
  // ...
})
export class JobTasksModule {}
```

---

#### 4.2 JobDescriptionsService Integration

**File**: `server/src/job-descriptions/job-descriptions.service.ts`

**Changes**:

```typescript
constructor(
  private prisma: PrismaService,
  private eventsService: EventsService,
) {}

async create(data: CreateJobDescriptionDto, userId: string): Promise<JobDescription> {
  const jobDescription = await this.prisma.jobDescription.create({ /* ... */ });

  // Emit event
  this.eventsService.broadcastEvent({
    type: 'job-description:created',
    data: jobDescription,
    userId,
    timestamp: new Date().toISOString(),
  });

  return jobDescription;
}

async set(id: number, data: UpdateJobDescriptionDto, userId: string): Promise<JobDescription> {
  const jobDescription = await this.prisma.jobDescription.update({ /* ... */ });

  // Emit event
  this.eventsService.broadcastEvent({
    type: 'job-description:updated',
    data: jobDescription,
    userId,
    timestamp: new Date().toISOString(),
  });

  return jobDescription;
}

async setPercentages(id: number, percentages: PercentageDto[], userId: string): Promise<JobDescription> {
  // ... update logic

  // Emit event
  this.eventsService.broadcastEvent({
    type: 'job-description-task:percentage-changed',
    data: { jobDescriptionId: id, percentages },
    userId,
    timestamp: new Date().toISOString(),
  });

  return jobDescription;
}

// Similar for delete(), restore(), permanentDelete()
```

**Import EventsModule** in `JobDescriptionsModule`.

---

#### 4.3 JobDescriptionTasksService Integration

**File**: `server/src/job-description-tasks/job-description-tasks.service.ts`

**Changes**:

```typescript
constructor(
  private prisma: PrismaService,
  private eventsService: EventsService,
) {}

async create(data: CreateJobDescriptionTaskDto, userId: string): Promise<JobDescription> {
  // ... create task, reorder, adjust percentages

  // Emit event
  this.eventsService.broadcastEvent({
    type: 'job-description-task:created',
    data: {
      jobDescriptionId: data.jobDescriptionId,
      jobTaskId: data.jobTaskId,
      jobDescription: updatedJobDescription,
    },
    userId,
    timestamp: new Date().toISOString(),
  });

  return updatedJobDescription;
}

async set(id: number, data: UpdateJobDescriptionTaskDto, userId: string): Promise<JobDescription> {
  // ... update order/percentage

  const jdTask = await this.prisma.jobDescriptionTask.findUnique({ where: { id } });

  this.eventsService.broadcastEvent({
    type: 'job-description-task:updated',
    data: {
      jobDescriptionId: jdTask.jobDescriptionId,
      jobDescriptionTaskId: id,
      jobDescription: updatedJobDescription,
    },
    userId,
    timestamp: new Date().toISOString(),
  });

  return updatedJobDescription;
}

async delete(id: number, userId: string): Promise<JobDescription> {
  // ... delete task, reorder, adjust percentages

  this.eventsService.broadcastEvent({
    type: 'job-description-task:deleted',
    data: {
      jobDescriptionId: jdTask.jobDescriptionId,
      jobTaskId: jdTask.jobTaskId,
      jobDescription: updatedJobDescription,
    },
    userId,
    timestamp: new Date().toISOString(),
  });

  return updatedJobDescription;
}
```

**Import EventsModule** in `JobDescriptionTasksModule`.

---

#### 4.4 LockService Integration

**File**: `server/src/lock/lock.service.ts`

**Changes**:

```typescript
constructor(
  private prisma: PrismaService,
  private configService: ConfigService,
  private eventsService: EventsService,
) {}

async acquireLock(
  entityType: 'JobTask' | 'JobDescription',
  entityId: number,
  userId: string,
): Promise<{ success: boolean; lockInfo?: any }> {
  // ... lock acquisition logic

  if (success) {
    this.eventsService.broadcastEvent({
      type: 'lock:acquired',
      data: {
        entityType,
        entityId,
        lockedById: userId,
        lockExpiry,
      },
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  return { success, lockInfo };
}

async releaseLock(
  entityType: 'JobTask' | 'JobDescription',
  entityId: number,
  userId: string,
): Promise<void> {
  // ... lock release logic

  this.eventsService.broadcastEvent({
    type: 'lock:released',
    data: { entityType, entityId },
    userId,
    timestamp: new Date().toISOString(),
  });
}

async breakLock(
  entityType: 'JobTask' | 'JobDescription',
  entityId: number,
  adminUserId: string,
): Promise<any> {
  // ... break lock logic

  this.eventsService.broadcastEvent({
    type: 'lock:broken',
    data: { entityType, entityId, brokenBy: adminUserId },
    userId: adminUserId,
    timestamp: new Date().toISOString(),
  });

  return lockStatus;
}
```

**Import EventsModule** in `LockModule`.

---

### 5. Update Controllers to Pass UserId

Ensure all controller methods pass `userId` from JWT payload to service methods.

**Example** (`job-tasks.controller.ts`):

```typescript
@Post()
@UseGuards(JwtAuthGuard, UserGuard)
async create(@Body() dto: CreateJobTaskDto, @Req() req) {
  return this.jobTasksService.create(dto, req.user.sub);
}

@Patch(':id')
@UseGuards(JwtAuthGuard, UserGuard, PessimisticLockGuard)
async update(@Param('id') id: string, @Body() dto: UpdateJobTaskDto, @Req() req) {
  return this.jobTasksService.set(+id, dto, req.user.sub);
}
```

Apply similar changes to:

- `job-descriptions.controller.ts`
- `job-description-tasks.controller.ts`
- `lock.controller.ts` (already has userId in most methods)

---

### 6. Add Configuration for SSE

**File**: `server/src/config/config.service.ts`

Add SSE configuration:

```typescript
getSseConfig() {
  return {
    heartbeatIntervalMs: parseInt(process.env.SSE_HEARTBEAT_INTERVAL_MS) || 30000,
    reconnectTimeoutMs: parseInt(process.env.SSE_RECONNECT_TIMEOUT_MS) || 5000,
  };
}
```

**Environment Variables** (`.env`):

```bash
SSE_HEARTBEAT_INTERVAL_MS=30000  # 30 seconds
SSE_RECONNECT_TIMEOUT_MS=5000     # 5 seconds
```

**Expose via Config Controller**:

```typescript
@Get()
getConfig() {
  return {
    lock: this.configService.getLockConfig(),
    sse: this.configService.getSseConfig(), // Add SSE config
  };
}
```

---

## Frontend Implementation

### 7. Create SSE Service

**File**: `client/src/app/services/sse.service.ts`

Central service for managing SSE connection and event distribution.

**Key Features**:

- Establish EventSource connection to `/api/events/stream`
- Authenticate using existing JWT cookie (automatically sent)
- Subscribe/unsubscribe to specific event types
- Handle reconnection on disconnect
- Provide typed observables for each event type

**Core Structure**:

```typescript
@Injectable({
  providedIn: "root",
})
export class SseService {
  private eventSource: EventSource | null = null;
  private reconnectTimer: any;

  // Event subjects for different event types
  private jobTaskEvents$ = new Subject<SseEvent>();
  private jobDescriptionEvents$ = new Subject<SseEvent>();
  private jobDescriptionTaskEvents$ = new Subject<SseEvent>();
  private lockEvents$ = new Subject<SseEvent>();
  private userPresenceEvents$ = new Subject<SseEvent>();

  // Connection state
  private connectionState$ = new BehaviorSubject<
    "connected" | "disconnected" | "reconnecting"
  >("disconnected");

  constructor(private env: EnvironmentService) {}

  // Public observables
  get jobTaskEvents(): Observable<SseEvent> {
    return this.jobTaskEvents$.asObservable();
  }

  get jobDescriptionEvents(): Observable<SseEvent> {
    return this.jobDescriptionEvents$.asObservable();
  }

  get jobDescriptionTaskEvents(): Observable<SseEvent> {
    return this.jobDescriptionTaskEvents$.asObservable();
  }

  get lockEvents(): Observable<SseEvent> {
    return this.lockEvents$.asObservable();
  }

  get userPresenceEvents(): Observable<SseEvent> {
    return this.userPresenceEvents$.asObservable();
  }

  get connectionState(): Observable<string> {
    return this.connectionState$.asObservable();
  }

  // Methods
  connect(): void {
    /* ... */
  }
  disconnect(): void {
    /* ... */
  }
  private reconnect(): void {
    /* ... */
  }
  private handleMessage(event: MessageEvent): void {
    /* ... */
  }
  private routeEvent(sseEvent: SseEvent): void {
    /* ... */
  }
}
```

**Connection Management**:

```typescript
connect(): void {
  if (this.eventSource) {
    return; // Already connected
  }

  const baseUrl = this.env.apiUrl || '';
  const url = `${baseUrl}/api/events/stream`;

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
    this.handleMessage(event);
  };

  this.eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    this.connectionState$.next('disconnected');
    this.eventSource?.close();
    this.eventSource = null;
    this.reconnect();
  };
}

private reconnect(): void {
  this.connectionState$.next('reconnecting');
  this.reconnectTimer = setTimeout(() => {
    console.log('Attempting to reconnect SSE...');
    this.connect();
  }, 5000); // 5 seconds
}

disconnect(): void {
  if (this.eventSource) {
    this.eventSource.close();
    this.eventSource = null;
    this.connectionState$.next('disconnected');
  }
  if (this.reconnectTimer) {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}
```

**Event Routing**:

```typescript
private handleMessage(event: MessageEvent): void {
  try {
    const sseEvent: SseEvent = JSON.parse(event.data);

    // Ignore heartbeat
    if (sseEvent.type === 'heartbeat') {
      return;
    }

    this.routeEvent(sseEvent);
  } catch (error) {
    console.error('Error parsing SSE event:', error);
  }
}

private routeEvent(sseEvent: SseEvent): void {
  const eventType = sseEvent.type;

  if (eventType.startsWith('job-task:')) {
    this.jobTaskEvents$.next(sseEvent);
  } else if (eventType.startsWith('job-description-task:')) {
    this.jobDescriptionTaskEvents$.next(sseEvent);
  } else if (eventType.startsWith('job-description:')) {
    this.jobDescriptionEvents$.next(sseEvent);
  } else if (eventType.startsWith('lock:')) {
    this.lockEvents$.next(sseEvent);
  } else if (eventType.startsWith('user:')) {
    this.userPresenceEvents$.next(sseEvent);
  }
}
```

**Lifecycle Management**:

```typescript
ngOnDestroy(): void {
  this.disconnect();
  this.jobTaskEvents$.complete();
  this.jobDescriptionEvents$.complete();
  this.jobDescriptionTaskEvents$.complete();
  this.lockEvents$.complete();
  this.userPresenceEvents$.complete();
  this.connectionState$.complete();
}
```

---

### 8. Integrate SSE into Existing Services

Update existing services to react to SSE events.

#### 8.1 Update LockService

**File**: `client/src/app/services/lock.service.ts`

**Changes**:

```typescript
constructor(
  private http: HttpClient,
  private env: EnvironmentService,
  private sseService: SseService, // Inject SseService
) {
  this.loadConfig();
  this.startHeartbeat();

  // Subscribe to lock events from SSE
  this.sseService.lockEvents.subscribe(event => {
    this.handleLockEvent(event);
  });
}

private handleLockEvent(event: SseEvent): void {
  const { type, data } = event;
  const lockKey = `${data.entityType}:${data.entityId}`;

  switch (type) {
    case 'lock:acquired':
      // Update local lock state
      this.locksMap.set(lockKey, {
        entityType: data.entityType,
        entityId: data.entityId,
        lockedById: data.lockedById,
        lockExpiry: new Date(data.lockExpiry),
      });
      this.lockState$.next(new Map(this.locksMap));
      break;

    case 'lock:released':
    case 'lock:expired':
    case 'lock:broken':
      // Remove from local lock state
      this.locksMap.delete(lockKey);
      this.lockState$.next(new Map(this.locksMap));
      break;

    case 'lock:refreshed':
      // Update lock expiry
      const existingLock = this.locksMap.get(lockKey);
      if (existingLock) {
        existingLock.lockExpiry = new Date(data.lockExpiry);
        this.lockState$.next(new Map(this.locksMap));
      }
      break;
  }
}
```

**Benefit**: Locks appear/disappear in real-time for all users viewing the same entity.

---

#### 8.2 Update JobTasksService

**File**: `client/src/app/services/job-tasks.service.ts`

**Changes**:

```typescript
constructor(
  private http: HttpClient,
  private env: EnvironmentService,
  private sseService: SseService, // Inject SseService
) {
  this.apiUrl = `${this.env.apiUrl || '/'}api/job-tasks`;

  // Subscribe to job task events from SSE
  this.sseService.jobTaskEvents.subscribe(event => {
    this.handleJobTaskEvent(event);
  });
}

private handleJobTaskEvent(event: SseEvent): void {
  const { type, data } = event;

  switch (type) {
    case 'job-task:created':
      // Add new task to local list
      const currentTasks = this.jobTasksSubject.value;
      this.jobTasksSubject.next([...currentTasks, data]);
      break;

    case 'job-task:updated':
      // Update existing task in local list
      const updatedTasks = this.jobTasksSubject.value.map(task =>
        task.id === data.id ? data : task
      );
      this.jobTasksSubject.next(updatedTasks);
      break;

    case 'job-task:deleted':
      // Mark as deleted or remove from list
      const tasksAfterDelete = this.jobTasksSubject.value.map(task =>
        task.id === data.id ? { ...task, deletedAt: new Date() } : task
      );
      this.jobTasksSubject.next(tasksAfterDelete);
      break;

    case 'job-task:restored':
      // Update restored task
      const restoredTasks = this.jobTasksSubject.value.map(task =>
        task.id === data.id ? { ...task, deletedAt: null } : task
      );
      this.jobTasksSubject.next(restoredTasks);
      break;
  }
}
```

**Benefit**: Job task list updates in real-time when other users create/edit/delete tasks.

---

#### 8.3 Update JobDescriptionsService

**File**: `client/src/app/services/job-descriptions.service.ts`

**Changes**:

```typescript
constructor(
  private http: HttpClient,
  private env: EnvironmentService,
  private sseService: SseService, // Inject SseService
) {
  this.apiUrl = `${this.env.apiUrl || '/'}api/job-descriptions`;
  this.loadJobDescriptions();

  // Subscribe to job description events from SSE
  this.sseService.jobDescriptionEvents.subscribe(event => {
    this.handleJobDescriptionEvent(event);
  });
}

private handleJobDescriptionEvent(event: SseEvent): void {
  const { type, data } = event;

  switch (type) {
    case 'job-description:created':
      const currentDescriptions = this.jobDescriptionsSubject.value;
      this.jobDescriptionsSubject.next([...currentDescriptions, data]);
      break;

    case 'job-description:updated':
      const updatedDescriptions = this.jobDescriptionsSubject.value.map(jd =>
        jd.id === data.id ? data : jd
      );
      this.jobDescriptionsSubject.next(updatedDescriptions);
      break;

    case 'job-description:deleted':
      const descriptionsAfterDelete = this.jobDescriptionsSubject.value.map(jd =>
        jd.id === data.id ? { ...jd, deletedAt: new Date() } : jd
      );
      this.jobDescriptionsSubject.next(descriptionsAfterDelete);
      break;

    case 'job-description:restored':
      const restoredDescriptions = this.jobDescriptionsSubject.value.map(jd =>
        jd.id === data.id ? { ...jd, deletedAt: null } : jd
      );
      this.jobDescriptionsSubject.next(restoredDescriptions);
      break;
  }
}
```

---

#### 8.4 Update CurrentWorkspaceService

**File**: `client/src/app/services/current-workspace.service.ts`

**Changes**:

```typescript
constructor(
  private http: HttpClient,
  private env: EnvironmentService,
  private sseService: SseService, // Inject SseService
) {
  // Subscribe to job description task events (workspace changes)
  this.sseService.jobDescriptionTaskEvents.subscribe(event => {
    this.handleWorkspaceEvent(event);
  });

  // Subscribe to job description events (workspace metadata changes)
  this.sseService.jobDescriptionEvents.subscribe(event => {
    this.handleWorkspaceMetadataEvent(event);
  });
}

private handleWorkspaceEvent(event: SseEvent): void {
  const currentJd = this.currentJobDescriptionSubject.value;

  // Only update if this event is for our current workspace
  if (!currentJd || currentJd.id !== event.data.jobDescriptionId) {
    return;
  }

  const { type } = event;

  switch (type) {
    case 'job-description-task:created':
    case 'job-description-task:updated':
    case 'job-description-task:deleted':
    case 'job-description-task:percentage-changed':
      // Fetch fresh data from server
      this.triggerJobDescriptionFetch(currentJd);
      break;
  }
}

private handleWorkspaceMetadataEvent(event: SseEvent): void {
  const currentJd = this.currentJobDescriptionSubject.value;

  // Only update if this event is for our current workspace
  if (!currentJd || currentJd.id !== event.data.id) {
    return;
  }

  if (event.type === 'job-description:updated') {
    // Update current workspace with fresh data
    this.currentJobDescriptionSubject.next(event.data);
  }
}
```

**Benefit**: Workspace updates in real-time when other users add/remove/reorder tasks or change percentages.

---

#### 8.5 Update CardService

**File**: `client/src/app/services/card.service.ts`

**Changes**:

```typescript
constructor(
  private currentWorkspaceService: CurrentWorkspaceService,
  private jobTasksService: JobTasksService,
  private sseService: SseService, // Inject SseService
) {
  // Existing subscriptions...

  // Subscribe to job task events for backlog updates
  this.sseService.jobTaskEvents.subscribe(event => {
    // CardService will automatically update because it subscribes to jobTasksService.jobTasks$
    // which is already being updated by JobTasksService's SSE handler
  });
}
```

**Benefit**: Card backlog automatically reflects changes when other users create/edit/delete tasks.

---

### 9. Update Components for Real-Time UI

Update components to show real-time collaboration indicators.

#### 9.1 Update JT Overview Accordion Component

**File**: `client/src/app/components/job-tasks/overview-accordion/jt-overview-accordion.component.ts`

**Changes**:

```typescript
constructor(
  private dialog: MatDialog,
  private jobTasksService: JobTasksService,
  private cardService: CardService,
  private currentWorkspaceService: CurrentWorkspaceService,
  private cdr: ChangeDetectorRef,
  private authService: AuthService,
  private lockService: LockService,
  private sseService: SseService, // Inject SseService
) {}

ngOnInit(): void {
  this.loadJobTasks();

  // Existing subscriptions...

  // Subscribe to SSE events for real-time updates
  this.subscription.add(
    this.sseService.jobTaskEvents.subscribe(event => {
      // JobTasksService already handles updates, just refresh UI
      this.cdr.markForCheck();
    })
  );

  this.subscription.add(
    this.sseService.lockEvents.subscribe(event => {
      // Lock events automatically update via LockService
      // Just refresh UI to show lock indicators
      this.cdr.markForCheck();
    })
  );
}
```

**Template Updates** (`jt-overview-accordion.component.html`):

Add connection status indicator:

```html
<div
  class="connection-status"
  *ngIf="(sseService.connectionState | async) as connStatus"
>
  <span *ngIf="connStatus === 'connected'" class="text-green-500">
    <mat-icon>cloud_done</mat-icon> Live
  </span>
  <span *ngIf="connStatus === 'reconnecting'" class="text-yellow-500">
    <mat-icon>cloud_sync</mat-icon> Reconnecting...
  </span>
  <span *ngIf="connStatus === 'disconnected'" class="text-red-500">
    <mat-icon>cloud_off</mat-icon> Offline
  </span>
</div>
```

---

#### 9.2 Update JD Overview Accordion Component

**File**: `client/src/app/components/job-descriptions/overview-accordion/jd-overview-accordion.component.ts`

**Changes**:

```typescript
constructor(
  private dialog: MatDialog,
  private jobDescriptionsService: JobDescriptionsService,
  private currentWorkspaceService: CurrentWorkspaceService,
  private authService: AuthService,
  private lockService: LockService,
  private sseService: SseService, // Inject SseService
) {}

ngOnInit(): void {
  this.loadJobDescriptions();

  // Existing subscriptions...

  // Subscribe to SSE events
  this.subscription.add(
    this.sseService.jobDescriptionEvents.subscribe(event => {
      // JobDescriptionsService already handles updates
      // Trigger change detection for UI update
      this.cdr?.markForCheck();
    })
  );

  this.subscription.add(
    this.sseService.lockEvents.subscribe(event => {
      // Refresh UI to show lock indicators
      this.cdr?.markForCheck();
    })
  );
}
```

Similar connection status indicator in template.

---

#### 9.3 Update Card Backlog Column Component

**File**: `client/src/app/columns/card-backlog-column/card-backlog-column.component.ts`

**Changes**:

```typescript
constructor(
  private dialog: MatDialog,
  private cardService: CardService,
  private currentWorkspaceService: CurrentWorkspaceService,
  private jobDescriptionsService: JobDescriptionsService,
  private authService: AuthService,
  private sseService: SseService, // Inject SseService
) {}

ngOnInit() {
  // Existing subscriptions...

  // CurrentWorkspaceService already handles workspace-specific SSE events
  // JobTasksService already handles job task SSE events
  // LockService already handles lock SSE events
  // All updates will flow through existing observables automatically
}
```

**Template Updates** (`card-backlog-column.component.html`):

Add connection indicator in toolbar or header area.

---

### 10. Initialize SSE Connection on App Start

**File**: `client/src/app/app.component.ts`

Start SSE connection when app initializes.

```typescript
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private authService: AuthService,
    private sseService: SseService
  ) {}

  ngOnInit() {
    // Connect SSE when user is authenticated
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.sseService.connect();
      } else {
        this.sseService.disconnect();
      }
    });
  }

  ngOnDestroy() {
    this.sseService.disconnect();
  }
}
```

---

## Manual Testing Checklist

- [ ] Open app in two browser windows (different users)
- [ ] Create JobTask in Window A → appears in Window B
- [ ] Lock JobTask in Window A → lock indicator in Window B
- [ ] Edit JobTask in Window A → updates in Window B
- [ ] Change percentages in Window A → updates in Window B
- [ ] Delete task in Window A → disappears in Window B
- [ ] Break lock as admin in Window A → lock released in Window B
- [ ] Disconnect network → reconnect → state syncs across all users
- [ ] SSE status indicator shows correct state

---

## Performance Considerations

### Backend Optimizations

1. **Event Throttling**:

   - Debounce rapid-fire events (e.g., percentage slider drag)
   - Batch multiple updates into single event

2. **Heartbeat Optimization**:
   - Use 30-second heartbeat (not too frequent)
   - Consider using comments instead of data events

### Frontend Optimizations

1. **Change Detection**:

   - Use `OnPush` change detection strategy
   - Only trigger `markForCheck()` when necessary

2. **Event Debouncing**:

   - Debounce SSE events to avoid excessive UI updates
   - Use `debounceTime(100)` on event streams

3. **Selective Updates**:

   - Only update UI components affected by event
   - Use trackBy functions in \*ngFor loops

4. **Memory Management**:
   - Properly unsubscribe from all observables
   - Clean up SSE connection on component destroy

---

## Security Considerations

1. **Authentication**:

   - SSE endpoint protected by JWT authentication
   - Validate JWT on every connection
   - Reject unauthenticated connections

2. **Authorization**:

   - Validate user permissions if needed for sensitive data
   - Don't expose sensitive data in events

3. **Rate Limiting**:

   - Implement rate limiting on SSE endpoint
   - Prevent DoS attacks via connection flooding

4. **Data Validation**:

   - Validate all event data before broadcasting
   - Sanitize user-generated content in events

5. **CORS**:
   - Configure CORS properly for SSE endpoint
   - Use `withCredentials: true` for cookie authentication

---

## Migration Plan

### Phase 1: Backend Foundation (2-3 days)

1. Create EventsModule, EventsService, EventsController
2. Add event emission to LockService
3. Test SSE endpoint with manual curl/EventSource
4. Add configuration support

### Phase 2: Backend Integration (2-3 days)

1. Integrate EventsService into JobTasksService
2. Integrate EventsService into JobDescriptionsService
3. Integrate EventsService into JobDescriptionTasksService
4. Update all controllers to pass userId

### Phase 3: Frontend Foundation (2-3 days)

1. Create SseService
2. Create connection status indicator component
3. Initialize SSE connection in AppComponent

### Phase 4: Frontend Integration (3-4 days)

1. Update LockService with SSE event handlers
2. Update JobTasksService with SSE event handlers
3. Update JobDescriptionsService with SSE event handlers
4. Update CurrentWorkspaceService with SSE event handlers
5. Update CardService (minimal changes)

### Phase 5: Component Updates (2-3 days)

1. Update JtOverviewAccordionComponent
2. Update JdOverviewAccordionComponent
3. Update CardBacklogColumnComponent

**Total Estimated Time**: 15-20 days

## Conclusion

This implementation plan provides a comprehensive roadmap for adding real-time collaboration to TDGen via Server-Sent Events. The design:

- ✅ Leverages existing JWT authentication
- ✅ Integrates seamlessly with pessimistic locking
- ✅ Uses existing RxJS/Observable patterns
- ✅ Requires minimal refactoring
- ✅ Provides graceful degradation (works without SSE)
- ✅ Scales to reasonable user concurrency
- ✅ Enhances collaboration without complexity

The phased migration approach allows for incremental development and testing, reducing risk and ensuring a smooth rollout.
