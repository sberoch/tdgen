import { EntityType } from './lock.service';

export class AcquireLockDto {
  entityType: EntityType;
  entityId: number;
  lockDurationMs?: number;
}

export class ReleaseLockDto {
  entityType: EntityType;
  entityId: number;
}

export class RefreshLockDto {
  entityType: EntityType;
  entityId: number;
  lockDurationMs?: number;
}

export class GetLockStatusDto {
  entityType: EntityType;
  entityId: number;
}

export class BreakLockDto {
  entityType: EntityType;
  entityId: number;
}

export class BreakLockResponse {
  success: boolean;
  message: string;
}
