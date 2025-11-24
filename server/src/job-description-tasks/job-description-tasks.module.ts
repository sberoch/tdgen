import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobDescriptionTasksController } from './job-description-tasks.controller';
import { JobDescriptionTasksService } from './job-description-tasks.service';
import { JobDescriptionTaskLockGuard } from './job-description-task-lock.guard';
import { JobDescriptionCreateLockGuard } from './job-description-create-lock.guard';
import { JobDescriptionsModule } from '../job-descriptions/job-descriptions.module';
import { EventsModule } from '../events/events.module';
import { LockModule } from '../lock/lock.module';

@Module({
  imports: [PrismaModule, JobDescriptionsModule, EventsModule, LockModule],
  controllers: [JobDescriptionTasksController],
  providers: [
    JobDescriptionTasksService,
    JobDescriptionTaskLockGuard,
    JobDescriptionCreateLockGuard,
  ],
  exports: [JobDescriptionTasksService],
})
export class JobDescriptionTasksModule {}
