import { EntityType } from './lock.service';

export class BreakLockDto {
  entityType: EntityType;
  entityId: number;
}

export class BreakLockResponse {
  success: boolean;
  message: string;
}
