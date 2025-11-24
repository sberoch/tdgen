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
import { JobDescriptionTasksService } from './job-description-tasks.service';

/**
 * Guard that validates JobDescription lock when modifying JobDescriptionTask relationships.
 *
 * This guard ensures that when users modify the structure of a job description
 * (e.g., reordering tasks, changing percentages, removing tasks), the job description
 * itself must be locked by the current user.
 *
 * Note: This does NOT check if the JobTask is locked - that's intentional.
 * Users should be able to reorder/adjust percentages even if a task is being edited by someone else.
 */
@Injectable()
export class JobDescriptionTaskLockGuard implements CanActivate {
  constructor(
    private lockService: LockService,
    private jobDescriptionTasksService: JobDescriptionTasksService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    // Extract JobDescriptionTask ID from route parameters
    const jdTaskId = request.params['id'];
    if (!jdTaskId || isNaN(parseInt(jdTaskId, 10))) {
      throw new HttpException(
        'Invalid job description task ID',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Fetch the JobDescriptionTask to get the associated JobDescription ID
    const jobDescriptionTask = await this.jobDescriptionTasksService.get(
      jdTaskId,
    );

    if (!jobDescriptionTask) {
      throw new HttpException(
        'Job description task not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const jobDescriptionId = jobDescriptionTask.jobDescriptionId;

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
        message: 'Job description must be locked before modifying its structure',
        error: 'Lock Required',
        lockInfo: {
          isLocked: false,
        },
      },
      HttpStatus.PRECONDITION_FAILED,
    );
  }
}
