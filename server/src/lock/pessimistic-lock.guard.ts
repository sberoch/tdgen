import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SamlUser } from '../auth/auth.service';
import { LockService, EntityType } from './lock.service';

export const LOCK_VALIDATION_KEY = 'lockValidation';
export interface LockValidationConfig {
  entityType: EntityType;
  paramName?: string; // Parameter name containing entity ID (default: 'id')
}

/**
 * Decorator to enable pessimistic lock validation on endpoints
 * @param entityType - Type of entity to validate lock for
 * @param paramName - Name of route parameter containing entity ID (default: 'id')
 */
export const ValidateLock = (
  entityType: EntityType,
  paramName: string = 'id',
) => SetMetadata(LOCK_VALIDATION_KEY, { entityType, paramName });

@Injectable()
export class PessimisticLockGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private lockService: LockService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const lockConfig = this.reflector.get<LockValidationConfig>(
      LOCK_VALIDATION_KEY,
      context.getHandler(),
    );

    // If no lock validation configured, allow request
    if (!lockConfig) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: SamlUser }>();
    const user = request.user;

    if (!user) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Extract entity ID from route parameters
    const entityId = parseInt(request.params[lockConfig.paramName || 'id'], 10);

    if (isNaN(entityId)) {
      throw new HttpException('Invalid entity ID', HttpStatus.BAD_REQUEST);
    }

    // Check lock status
    const lockInfo = await this.lockService.isLocked(
      lockConfig.entityType,
      entityId,
    );

    // If resource is locked
    if (lockInfo.isLocked) {
      // Check if current user owns the lock
      if (lockInfo.lockedById !== user.id) {
        throw new HttpException(
          {
            statusCode: HttpStatus.LOCKED,
            message: 'Resource is locked by another user',
            error: 'Locked',
            lockInfo: {
              isLocked: true,
              lockedById: lockInfo.lockedById,
              lockedAt: lockInfo.lockedAt,
              lockExpiry: lockInfo.lockExpiry,
            },
          },
          HttpStatus.LOCKED,
        );
      }
      // User owns the lock, allow operation
      return true;
    }

    // Resource is not locked - this is a problem!
    // Users should acquire locks before attempting modifications
    throw new HttpException(
      {
        statusCode: HttpStatus.PRECONDITION_FAILED,
        message: 'Resource must be locked before modification',
        error: 'Lock Required',
        lockInfo: {
          isLocked: false,
        },
      },
      HttpStatus.PRECONDITION_FAILED,
    );
  }
}
