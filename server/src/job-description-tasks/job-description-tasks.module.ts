import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobDescriptionTasksController } from './job-description-tasks.controller';
import { JobDescriptionTasksService } from './job-description-tasks.service';

@Module({
  imports: [PrismaModule],
  controllers: [JobDescriptionTasksController],
  providers: [JobDescriptionTasksService],
  exports: [JobDescriptionTasksService],
})
export class JobDescriptionTasksModule {}
