import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LockService, LockInfo } from './lock.service';
import {
  AcquireLockDto,
  ReleaseLockDto,
  RefreshLockDto,
  GetLockStatusDto,
  BreakLockDto,
  BreakLockResponse,
} from './lock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UserGuard } from '../auth/user.guard';
import { Request } from 'express';
import { SamlUser } from '../auth/auth.service';

@Controller('locks')
export class LockController {
  constructor(private readonly lockService: LockService) {}

  @Post('acquire')
  @UseGuards(JwtAuthGuard, UserGuard)
  async acquireLock(
    @Body() dto: AcquireLockDto,
    @Req() req: Request & { user: SamlUser },
  ): Promise<boolean> {
    const success = await this.lockService.acquireLock(
      dto.entityType,
      dto.entityId,
      req.user.id,
      dto.lockDurationMs,
    );

    return success;
  }

  @Post('release')
  @UseGuards(JwtAuthGuard, UserGuard)
  async releaseLock(
    @Body() dto: ReleaseLockDto,
    @Req() req: Request & { user: SamlUser },
  ): Promise<boolean> {
    const success = await this.lockService.releaseLock(
      dto.entityType,
      dto.entityId,
      req.user.id,
    );

    return success;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, UserGuard)
  async refreshLock(
    @Body() dto: RefreshLockDto,
    @Req() req: Request & { user: SamlUser },
  ): Promise<boolean> {
    const success = await this.lockService.refreshLock(
      dto.entityType,
      dto.entityId,
      req.user.id,
      dto.lockDurationMs,
    );

    return success;
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, UserGuard)
  async getLockStatus(@Query() dto: GetLockStatusDto): Promise<LockInfo> {
    const lockInfo = await this.lockService.isLocked(
      dto.entityType,
      Number(dto.entityId),
    );

    return lockInfo;
  }

  @Post('break')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async breakLock(
    @Body() dto: BreakLockDto,
    @Req() req: Request & { user: SamlUser },
  ): Promise<BreakLockResponse> {
    const success = await this.lockService.breakLock(
      dto.entityType,
      dto.entityId,
    );

    if (!success) {
      throw new HttpException(
        'Failed to break lock',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      success: true,
      message: `Lock broken by admin ${req.user.username || req.user.id}`,
    };
  }
}
