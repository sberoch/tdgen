// Types matching backend lock.service.ts and lock.dto.ts
// Note: Dates are serialized as ISO strings over HTTP

export type EntityType = 'JobTask' | 'JobDescription';

export interface LockInfo {
  isLocked: boolean;
  lockedAt?: string;
  lockedById?: string;
  lockExpiry?: string;
}

export interface BreakLockDto {
  entityType: EntityType;
  entityId: number;
}

export interface BreakLockResponse {
  success: boolean;
  message: string;
}
