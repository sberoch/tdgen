import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, of } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { EnvironmentService } from './environment.service';
import { AuthService } from './auth.service';
import {
  EntityType,
  LockInfo,
  BreakLockDto,
  BreakLockResponse,
} from '../types/lock.types';

interface LockState {
  entityType: EntityType;
  entityId: number;
  lockInfo: LockInfo;
  lastRefreshed: Date;
}

@Injectable({
  providedIn: 'root',
})
export class LockService implements OnDestroy {
  private apiUrl: string;
  private DEFAULT_LOCK_DURATION_MS: number = 30 * 60 * 1000; // 30 minutes (default)
  private REFRESH_INTERVAL_MS: number = 5 * 60 * 1000; // 5 minutes (default)

  // Track locks currently held by this client
  private locksMap = new Map<string, LockState>();

  // Observables for lock state changes
  private lockStateSubject = new BehaviorSubject<Map<string, LockState>>(
    new Map()
  );
  public lockState$ = this.lockStateSubject.asObservable();

  // Observable for lock conflict notifications
  private lockConflictSubject = new Subject<{
    entityType: EntityType;
    entityId: number;
    lockInfo: LockInfo;
    action: string;
  }>();
  public lockConflict$ = this.lockConflictSubject.asObservable();

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private env: EnvironmentService,
    private authService: AuthService
  ) {
    this.apiUrl = `${this.env.apiUrl || '/'}api`;
    this.loadConfigAndStartHeartbeat();
  }

  /**
   * Load configuration from server and start heartbeat
   */
  private loadConfigAndStartHeartbeat(): void {
    this.http.get<any>(`${this.apiUrl}/config`).subscribe({
      next: (config) => {
        if (config.lockDurationMs) {
          this.DEFAULT_LOCK_DURATION_MS = config.lockDurationMs;
        }
        if (config.lockRefreshIntervalMs) {
          this.REFRESH_INTERVAL_MS = config.lockRefreshIntervalMs;
        }
        this.startHeartbeat();
      },
      error: (err) => {
        console.error('Failed to load lock configuration, using defaults', err);
        this.startHeartbeat();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.releaseAllLocks();
  }

  /**
   * Start heartbeat mechanism to auto-refresh locks
   */
  private startHeartbeat(): void {
    interval(this.REFRESH_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshAllActiveLocks();
      });
  }

  /**
   * Acquire a lock on an entity
   */
  acquireLock(
    entityType: EntityType,
    entityId: number,
    lockDurationMs: number = this.DEFAULT_LOCK_DURATION_MS
  ): Observable<boolean> {
    const url = `${this.apiUrl}/locks/acquire`;
    const body = {
      entityType,
      entityId,
      lockDurationMs,
    };

    return this.http.post<boolean>(url, body).pipe(
      map((success) => {
        if (success) {
          const key = this.getLockKey(entityType, entityId);
          const now = new Date();
          const lockState: LockState = {
            entityType,
            entityId,
            lockInfo: {
              isLocked: true,
              lockedAt: now.toISOString(),
              lockedById: this.authService.getCurrentUser()?.id,
              lockExpiry: new Date(
                now.getTime() + lockDurationMs
              ).toISOString(),
            },
            lastRefreshed: now,
          };
          this.locksMap.set(key, lockState);
          this.lockStateSubject.next(new Map(this.locksMap));
        }
        return success;
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleLockError(error, entityType, entityId, 'acquire');
        return of(false);
      })
    );
  }

  /**
   * Release a lock on an entity
   */
  releaseLock(entityType: EntityType, entityId: number): Observable<boolean> {
    const url = `${this.apiUrl}/locks/release`;
    const body = {
      entityType,
      entityId,
    };

    return this.http.post<boolean>(url, body).pipe(
      map((success) => {
        if (success) {
          const key = this.getLockKey(entityType, entityId);
          this.locksMap.delete(key);
          this.lockStateSubject.next(new Map(this.locksMap));
        }
        return success;
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleLockError(error, entityType, entityId, 'release');
        return of(false);
      })
    );
  }

  /**
   * Refresh a lock to extend its duration
   */
  refreshLock(
    entityType: EntityType,
    entityId: number,
    lockDurationMs: number = this.DEFAULT_LOCK_DURATION_MS
  ): Observable<boolean> {
    const url = `${this.apiUrl}/locks/refresh`;
    const body = {
      entityType,
      entityId,
      lockDurationMs,
    };

    return this.http.post<boolean>(url, body).pipe(
      map((success) => {
        if (success) {
          const key = this.getLockKey(entityType, entityId);
          const existingLock = this.locksMap.get(key);
          if (existingLock) {
            const now = new Date();
            existingLock.lockInfo.lockExpiry = new Date(
              now.getTime() + lockDurationMs
            ).toISOString();
            existingLock.lastRefreshed = now;
            this.lockStateSubject.next(new Map(this.locksMap));
          }
        }
        return success;
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleLockError(error, entityType, entityId, 'refresh');
        return of(false);
      })
    );
  }

  /**
   * Check if an entity is locked
   */
  getLockStatus(
    entityType: EntityType,
    entityId: number
  ): Observable<LockInfo> {
    const url = `${this.apiUrl}/locks/status`;
    const params = {
      entityType,
      entityId: entityId.toString(),
    };

    return this.http
      .get<LockInfo>(url, { params })
      .pipe(catchError(() => of({ isLocked: false })));
  }

  /**
   * Break a lock (admin only)
   */
  breakLock(
    entityType: EntityType,
    entityId: number
  ): Observable<BreakLockResponse> {
    const url = `${this.apiUrl}/locks/break`;
    const body: BreakLockDto = {
      entityType,
      entityId,
    };

    return this.http.post<BreakLockResponse>(url, body).pipe(
      map((response) => {
        // Remove from local state if broken
        const key = this.getLockKey(entityType, entityId);
        this.locksMap.delete(key);
        this.lockStateSubject.next(new Map(this.locksMap));
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        throw error;
      })
    );
  }

  /**
   * Check if current user holds a lock on an entity
   */
  hasLock(entityType: EntityType, entityId: number): boolean {
    const key = this.getLockKey(entityType, entityId);
    return this.locksMap.has(key);
  }

  /**
   * Get lock state for an entity
   */
  getLockState(
    entityType: EntityType,
    entityId: number
  ): LockState | undefined {
    const key = this.getLockKey(entityType, entityId);
    return this.locksMap.get(key);
  }

  /**
   * Refresh all active locks
   */
  private refreshAllActiveLocks(): void {
    this.locksMap.forEach((lockState) => {
      this.refreshLock(
        lockState.entityType,
        lockState.entityId,
        this.DEFAULT_LOCK_DURATION_MS
      ).subscribe();
    });
  }

  /**
   * Release all locks held by this client
   */
  private releaseAllLocks(): void {
    this.locksMap.forEach((lockState) => {
      this.releaseLock(lockState.entityType, lockState.entityId).subscribe();
    });
  }

  /**
   * Handle lock-related HTTP errors
   */
  private handleLockError(
    error: HttpErrorResponse,
    entityType: EntityType,
    entityId: number,
    action: string
  ): void {
    if (error.status === 423) {
      // Resource is locked by another user
      const lockInfo = error.error?.lockInfo as LockInfo;
      this.lockConflictSubject.next({
        entityType,
        entityId,
        lockInfo,
        action,
      });
    } else if (error.status === 412) {
      // Lock required but not held
      console.warn(`Lock required for ${action} on ${entityType}:${entityId}`);
    } else {
      console.error(
        `Lock operation failed for ${action} on ${entityType}:${entityId}`,
        error
      );
    }
  }

  /**
   * Generate unique key for lock tracking
   */
  private getLockKey(entityType: EntityType, entityId: number): string {
    return `${entityType}:${entityId}`;
  }
}
