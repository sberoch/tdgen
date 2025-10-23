import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LockService } from './lock.service';
import { LockController } from './lock.controller';
import { PessimisticLockGuard } from './pessimistic-lock.guard';
import { LockCleanupService } from './lock-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [LockController],
  providers: [LockService, PessimisticLockGuard, LockCleanupService],
  exports: [LockService, PessimisticLockGuard],
})
export class LockModule {}
