import { Module } from '@nestjs/common';
import { LockService } from './lock.service';
import { LockController } from './lock.controller';
import { PessimisticLockGuard } from './pessimistic-lock.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LockController],
  providers: [LockService, PessimisticLockGuard],
  exports: [LockService, PessimisticLockGuard],
})
export class LockModule {}
