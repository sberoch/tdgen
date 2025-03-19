import { Module } from '@nestjs/common';
import { JobTasksController } from './job-tasks.controller';
import { JobTasksService } from './job-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobTasksController],
  providers: [JobTasksService],
  exports: [JobTasksService],
})
export class JobTasksModule {}
