import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type EntityType = 'JobTask' | 'JobDescription';

export interface LockInfo {
  isLocked: boolean;
  lockedAt?: Date;
  lockedById?: string;
  lockExpiry?: Date;
}

export interface LockUpdateDto {
  lockedAt?: Date | null;
  lockedById?: string | null;
  lockExpiry?: Date | null;
}

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);
  private readonly DEFAULT_LOCK_DURATION_MS: number;
  private readonly CLEANED_LOCK: LockUpdateDto = {
    lockedAt: null,
    lockedById: null,
    lockExpiry: null,
  };

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Load lock duration from environment or use default (30 minutes)
    this.DEFAULT_LOCK_DURATION_MS =
      this.configService.get<number>('LOCK_DURATION_MS') || 30 * 60 * 1000;
  }

  /**
   * Acquire a lock on an entity
   * @returns true if lock acquired, false if already locked by another user
   */
  async acquireLock(
    entityType: EntityType,
    entityId: number,
    userId: string,
    lockDurationMs: number = this.DEFAULT_LOCK_DURATION_MS,
  ): Promise<boolean> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + lockDurationMs);

    try {
      // First, cleanup expired locks
      await this.cleanupExpiredLocks();

      // Check if entity is currently locked by someone else
      const entity = await this.getEntity(entityType, entityId);
      if (!entity) {
        this.logger.warn(`Entity ${entityType}:${entityId} not found`);
        return false;
      }

      // If locked by another user and not expired, cannot acquire
      if (
        entity.lockedById &&
        entity.lockedById !== userId &&
        entity.lockExpiry &&
        entity.lockExpiry > now
      ) {
        this.logger.debug(
          `Entity ${entityType}:${entityId} is locked by ${entity.lockedById}`,
        );
        return false;
      }

      // Acquire or refresh lock
      await this.updateEntityLock(entityType, entityId, {
        lockedAt: now,
        lockedById: userId,
        lockExpiry,
      });

      this.logger.debug(
        `Lock acquired on ${entityType}:${entityId} by ${userId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to acquire lock on ${entityType}:${entityId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Release a lock (owner only)
   * @returns true if released, false if not owned by user
   */
  async releaseLock(
    entityType: EntityType,
    entityId: number,
    userId: string,
  ): Promise<boolean> {
    try {
      const entity = await this.getEntity(entityType, entityId);
      if (!entity) {
        return false;
      }

      // Only owner can release
      if (entity.lockedById !== userId) {
        this.logger.warn(
          `User ${userId} attempted to release lock owned by ${entity.lockedById}`,
        );
        return false;
      }

      await this.updateEntityLock(entityType, entityId, this.CLEANED_LOCK);

      this.logger.debug(
        `Lock released on ${entityType}:${entityId} by ${userId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to release lock on ${entityType}:${entityId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Force release a lock (admin operation)
   */
  async breakLock(entityType: EntityType, entityId: number): Promise<boolean> {
    try {
      const entity = await this.getEntity(entityType, entityId);
      if (!entity) {
        return false;
      }

      await this.updateEntityLock(entityType, entityId, this.CLEANED_LOCK);

      this.logger.log(`Lock broken on ${entityType}:${entityId} by admin`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to break lock on ${entityType}:${entityId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Refresh/extend lock duration
   * @returns true if refreshed, false if not owned by user
   */
  async refreshLock(
    entityType: EntityType,
    entityId: number,
    userId: string,
    lockDurationMs: number = this.DEFAULT_LOCK_DURATION_MS,
  ): Promise<boolean> {
    try {
      const entity = await this.getEntity(entityType, entityId);
      if (!entity || entity.lockedById !== userId) {
        return false;
      }

      const now = new Date();
      const lockExpiry = new Date(now.getTime() + lockDurationMs);

      await this.updateEntityLock(entityType, entityId, {
        lockExpiry,
      });

      this.logger.debug(
        `Lock refreshed on ${entityType}:${entityId} by ${userId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to refresh lock on ${entityType}:${entityId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if entity is locked
   */
  async isLocked(entityType: EntityType, entityId: number): Promise<LockInfo> {
    const entity = await this.getEntity(entityType, entityId);
    if (!entity) {
      return { isLocked: false };
    }

    const now = new Date();
    const isLocked =
      !!entity.lockedById && !!entity.lockExpiry && entity.lockExpiry > now;

    return {
      isLocked,
      lockedAt: entity.lockedAt ?? undefined,
      lockedById: entity.lockedById ?? undefined,
      lockExpiry: entity.lockExpiry ?? undefined,
    };
  }

  /**
   * Cleanup expired locks (background job)
   */
  async cleanupExpiredLocks(): Promise<number> {
    const now = new Date();
    let count = 0;

    try {
      // Clean expired JobTask locks
      const taskResult = await this.prisma.jobTask.updateMany({
        where: {
          lockExpiry: {
            lte: now,
          },
          lockedById: {
            not: null,
          },
        },
        data: {
          lockedAt: null,
          lockedById: null,
          lockExpiry: null,
        },
      });
      count += taskResult.count;

      // Clean expired JobDescription locks
      const descResult = await this.prisma.jobDescription.updateMany({
        where: {
          lockExpiry: {
            lte: now,
          },
          lockedById: {
            not: null,
          },
        },
        data: {
          lockedAt: null,
          lockedById: null,
          lockExpiry: null,
        },
      });
      count += descResult.count;

      if (count > 0) {
        this.logger.log(`Cleaned up ${count} expired locks`);
      }

      return count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired locks', error);
      return 0;
    }
  }

  private async getEntity(entityType: EntityType, entityId: number) {
    if (entityType === 'JobTask') {
      return this.prisma.jobTask.findUnique({
        where: { id: entityId },
        select: { lockedAt: true, lockedById: true, lockExpiry: true },
      });
    } else {
      return this.prisma.jobDescription.findUnique({
        where: { id: entityId },
        select: { lockedAt: true, lockedById: true, lockExpiry: true },
      });
    }
  }

  private async updateEntityLock(
    entityType: EntityType,
    entityId: number,
    data: LockUpdateDto,
  ) {
    if (entityType === 'JobTask') {
      return this.prisma.jobTask.update({
        where: { id: entityId },
        data,
      });
    } else {
      return this.prisma.jobDescription.update({
        where: { id: entityId },
        data,
      });
    }
  }
}
