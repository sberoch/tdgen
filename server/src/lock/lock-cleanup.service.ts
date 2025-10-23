import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LockService } from './lock.service';

@Injectable()
export class LockCleanupService {
  private readonly logger = new Logger(LockCleanupService.name);

  constructor(private lockService: LockService) {
    this.logger.log('Lock cleanup job initialized (runs every 5 minutes)');
  }

  /**
   * Scheduled task to clean up expired and orphaned locks
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleLockCleanup() {
    this.logger.debug('Running scheduled lock cleanup...');

    try {
      const cleanedCount = await this.lockService.cleanupExpiredLocks();

      if (cleanedCount > 0) {
        this.logger.log(
          `Scheduled cleanup completed: ${cleanedCount} locks cleaned`,
        );
      } else {
        this.logger.debug('Scheduled cleanup completed: no locks to clean');
      }
    } catch (error) {
      this.logger.error('Scheduled lock cleanup failed', error);
    }
  }
}
