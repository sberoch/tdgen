import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LockService } from './lock.service';
import { BreakLockDto, BreakLockResponse } from './lock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Request } from 'express';
import { SamlUser } from '../auth/auth.service';

@Controller('locks')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LockController {
  constructor(private readonly lockService: LockService) {}

  @Post('break')
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
