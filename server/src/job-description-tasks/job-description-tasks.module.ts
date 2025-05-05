import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobDescriptionTasksController } from './job-description-tasks.controller';
import { JobDescriptionTasksService } from './job-description-tasks.service';
import { JobDescriptionsModule } from '../job-descriptions/job-descriptions.module';

@Module({
  imports: [PrismaModule, JobDescriptionsModule],
  controllers: [JobDescriptionTasksController],
  providers: [JobDescriptionTasksService],
  exports: [JobDescriptionTasksService],
})
export class JobDescriptionTasksModule {}
