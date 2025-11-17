import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobDescriptionTasksController } from './job-description-tasks.controller';
import { JobDescriptionTasksService } from './job-description-tasks.service';
import { JobDescriptionsModule } from '../job-descriptions/job-descriptions.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, JobDescriptionsModule, EventsModule],
  controllers: [JobDescriptionTasksController],
  providers: [JobDescriptionTasksService],
  exports: [JobDescriptionTasksService],
})
export class JobDescriptionTasksModule {}
