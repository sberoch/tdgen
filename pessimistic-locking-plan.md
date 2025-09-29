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

3. **Create LockService**

   - `acquireLock(entityType, entityId, userId, lockDuration)` - Acquire lock with timeout
   - `releaseLock(entityType, entityId, userId)` - Release lock (owner only)
   - `refreshLock(entityType, entityId, userId)` - Extend lock duration
   - `cleanupExpiredLocks()` - Background job to remove expired locks

4. **Add lock interceptor/guard**

   - Create `PessimisticLockGuard` for protecting update/delete endpoints
   - Auto-acquire lock on GET operations for editing
   - Validate lock ownership before modifications
   - Return lock status in API responses

5. **Update service methods**

   - Modify JobTasksService.set() to check/acquire locks
   - Modify JobTasksService.delete() to check/acquire locks
   - Modify JobDescriptionsService.set() to check/acquire locks
   - Modify JobDescriptionsService.setPercentages() to check/acquire locks
   - Modify JobDescriptionsService.delete() to check/acquire locks

6. **Add new API endpoints**
   - `DELETE /api/job-tasks/:id/lock` - Release/break lock (owner can release, admin can break)
   - `DELETE /api/job-descriptions/:id/lock` - Release/break lock (owner can release, admin can break)

## Frontend Implementation

7. **Create LockService (Angular)**

   - Track locked resources in memory
   - Handle lock acquisition/release
   - Auto-refresh locks for active editing sessions
   - Handle lock conflicts and user notifications

8. **Update component behavior**

   - Acquire lock when opening edit forms/dialogs
   - Display lock status indicators (locked by current user vs. others)
   - Show warning messages when resource is locked by another user
   - Auto-release locks when leaving edit mode
   - Implement heartbeat mechanism to maintain locks during active editing

9. **Add lock status indicators**

   - Visual indicators in task/description lists showing locked items
   - Lock ownership information (who has the lock)
   - Lock expiry countdown timers

10. **Handle lock conflicts**
    - Block edit operations for locked resources
    - Provide "break lock" option for admins (force release another user's lock)
    - Show graceful error messages with lock owner info and retry options
    - Show lock expiry countdown so users know when they can retry

## Configuration & Background Jobs

11. **Add configuration**

    - Lock timeout duration (default: 30 minutes)
    - Lock refresh interval (default: 5 minutes)
    - Configure via environment variables

12. **Schedule cleanup job**
    - Cron job to clean expired locks every 5 minutes
    - Log lock cleanup activities
    - Handle orphaned locks from crashed sessions

## Error Handling & Edge Cases

13. **Handle edge cases**

    - Browser close/crash scenarios (heartbeat failure)
    - Network disconnections during editing
    - Concurrent lock requests
    - Lock inheritance for related entities (JobDescriptionTask updates)

14. **Add appropriate error responses**
    - HTTP 423 Locked for locked resources
    - Detailed error messages with lock information
    - Retry mechanisms with exponential backoff

## Testing

15. **Write unit tests**

    - LockService functionality
    - Guard behavior
    - Service method lock validation
    - Lock expiry and cleanup

16. **Write integration tests**
    - Concurrent editing scenarios
    - Lock acquisition/release flows
    - Frontend-backend lock synchronization

## Rollout Strategy

17. **Feature flag implementation**

    - Add feature toggle for pessimistic locking
    - Gradual rollout with monitoring
    - Fallback to current behavior if issues arise

18. **Database migration**
    - Run schema migration during maintenance window
    - Verify lock fields are properly indexed
    - Monitor performance impact
