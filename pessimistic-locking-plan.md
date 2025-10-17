# Pessimistic Locking Implementation Plan

## Overview

Implement pessimistic locking to prevent concurrent modifications of JobTask and JobDescription entities, ensuring data integrity when multiple employees attempt to edit the same resources simultaneously.

## Database Schema Changes

1. ~~**Add locking fields to JobTask and JobDescription tables**~~ (DONE)

   - `lockedAt: DateTime?` - Timestamp when resource was locked
   - `lockedById: String?` - User ID who holds the lock
   - `lockExpiry: DateTime?` - When lock expires (auto-release)

2. ~~**Create Prisma migration**~~ (DONE)
   - Generate migration for new fields
   - Deploy to development and production databases

## Backend Implementation

3. ~~**Create LockService**~~ (DONE)

   - `acquireLock(entityType, entityId, userId, lockDuration)` - Acquire lock with timeout
   - `releaseLock(entityType, entityId, userId)` - Release lock (owner only)
   - `refreshLock(entityType, entityId, userId)` - Extend lock duration
   - `cleanupExpiredLocks()` - Background job to remove expired locks

4. ~~**Add lock validation interceptor/guard**~~ (DONE)

   - Create `PessimisticLockGuard` to validate lock ownership on update/delete endpoints
   - Verify that the requesting user holds a valid (non-expired) lock before allowing modifications
   - Reject operations with HTTP 423 Locked if lock is not held by the requesting user
   - Do NOT auto-acquire locks (lock acquisition is frontend-driven on accordion expansion)
   - Return detailed lock metadata in API responses:
     - Lock status (locked/unlocked)
     - Lock owner ID and name
     - Lock expiry timestamp
     - Whether current user owns the lock

5. ~~**Add new API endpoints**~~ (DONE)
   - `POST /api/locks/acquire` - Acquire lock on entity (user)
   - `POST /api/locks/release` - Release owned lock (user)
   - `POST /api/locks/refresh` - Extend lock duration (user)
   - `GET /api/locks/status` - Check lock status (user)
   - `POST /api/locks/break` - Force break lock (admin only)
     - Body: `{ entityType: 'JobTask' | 'JobDescription', entityId: number }`
     - Returns lock status after breaking
     - Logs admin action for audit trail

## Frontend Implementation

6. ~~**Create LockService (Angular)**~~ (DONE)

   - Track locked resources in memory
   - Handle lock acquisition/release via HTTP endpoints
   - Auto-refresh locks for active editing sessions (5-minute heartbeat)
   - Handle lock conflicts and user notifications (HTTP 423/412)
   - Observable-based state management for reactive UI updates
   - Auto-cleanup on service destruction

7. ~~**Update component behavior**~~ (DONE)

   - Acquire lock when **expanding accordion items** (NOT when editing begins)
     - JobTask accordion: jt-overview-accordion.component.ts toggleAccordion()
     - JobDescription accordion: jd-overview-accordion.component.ts toggleAccordion()
   - Check lock status BEFORE allowing accordion expansion
     - If locked by another user: row appears disabled (cursor-not-allowed, opacity-60) and prevent click
     - If unlocked or owned by current user: proceed with expansion and acquire lock
   - Display lock status indicators on accordion row headers (before expansion)
     - Visual lock icon (mat-icon lock) in secondary color after title for locked items
     - Shows lock owner via tooltip: "Locked by user {userId}"
   - Auto-release locks when **collapsing accordion items** (toggling closed)
   - LockService's heartbeat mechanism automatically maintains locks while expanded
   - ngOnDestroy releases any held locks on component destruction

8. ~~**Add lock status indicators**~~ (DONE)

   - Visual indicators in task/description lists showing locked items
   - Lock ownership information (who has the lock)

9. ~~**Handle lock conflicts**~~ (DONE)
   - Provide "break lock" option for admins (force release another user's lock)

## Configuration & Background Jobs

10. **Add configuration**

    - Lock timeout duration (default: 30 minutes)
    - Lock refresh interval (default: 5 minutes)
    - Configure via environment variables

11. **Schedule cleanup job**
    - Cron job to clean expired locks every 5 minutes
    - Log lock cleanup activities
    - Handle orphaned locks from crashed sessions

## Error Handling & Edge Cases

12. **Handle edge cases**

    - Browser close/crash scenarios (heartbeat failure)
    - Network disconnections during editing
    - Concurrent lock requests
    - Lock inheritance for related entities (JobDescriptionTask updates)

13. **Add appropriate error responses**
    - Detailed error messages with lock information
    - Retry mechanisms with exponential backoff
