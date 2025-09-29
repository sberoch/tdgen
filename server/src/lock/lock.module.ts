import { Module } from '@nestjs/common';
import { LockService } from './lock.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LockService],
  exports: [LockService],
})
export class LockModule {}
