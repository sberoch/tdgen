import { Module } from '@nestjs/common';
import { JobTasksController } from './job-tasks.controller';
import { JobTasksService } from './job-tasks.service';

@Module({
  controllers: [JobTasksController],
  providers: [JobTasksService],
})
export class JobTasksModule {}
