import { Module } from '@nestjs/common';
import { JobTasksController } from './job-tasks.controller';
import { JobTasksService } from './job-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LockModule } from '../lock/lock.module';

@Module({
  imports: [PrismaModule, LockModule],
  controllers: [JobTasksController],
  providers: [JobTasksService],
  exports: [JobTasksService],
})
export class JobTasksModule {}
