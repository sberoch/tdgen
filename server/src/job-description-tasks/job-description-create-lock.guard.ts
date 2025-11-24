import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';
import { SamlUser } from '../auth/auth.service';
import { LockService } from '../lock/lock.service';
import { CreateJobDescriptionTaskDto } from './job-description-tasks.dto';

/**
 * Guard that validates JobDescription lock when creating new JobDescriptionTask relationships.
 *
 * This guard ensures that when users add tasks to a job description (modifying its structure),
 * the job description must be locked by the current user.
 */
@Injectable()
export class JobDescriptionCreateLockGuard implements CanActivate {
  constructor(private lockService: LockService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user: SamlUser; body: CreateJobDescriptionTaskDto }
      >();
    const user = request.user;

    if (!user) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Extract jobDescriptionId from request body
    const { jobDescriptionId } = request.body;

    if (!jobDescriptionId) {
      throw new HttpException(
        'jobDescriptionId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if JobDescription is locked
    const lockInfo = await this.lockService.isLocked(
      'JobDescription',
      jobDescriptionId,
    );

    // If JobDescription is locked
    if (lockInfo.isLocked) {
      // Check if current user owns the lock
      if (lockInfo.lockedById !== user.id) {
        throw new HttpException(
          {
            statusCode: HttpStatus.LOCKED,
            message: 'Job description is locked by another user',
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

    // JobDescription is not locked - require lock for structural changes
    throw new HttpException(
      {
        statusCode: HttpStatus.PRECONDITION_FAILED,
        message: 'Job description must be locked before adding tasks',
        error: 'Lock Required',
        lockInfo: {
          isLocked: false,
        },
      },
      HttpStatus.PRECONDITION_FAILED,
    );
  }
}
