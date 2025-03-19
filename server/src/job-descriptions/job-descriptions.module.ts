import { Module } from '@nestjs/common';
import { JobDescriptionsController } from './job-descriptions.controller';
import { JobDescriptionsService } from './job-descriptions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobDescriptionsController],
  providers: [JobDescriptionsService],
  exports: [JobDescriptionsService],
})
export class JobDescriptionsModule {}
