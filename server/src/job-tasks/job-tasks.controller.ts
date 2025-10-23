import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JobTask } from '@prisma/client';
import {
  CreateJobTaskDto,
  UpdateJobTaskDto,
  JobTaskParams,
  JobTasksListResponse,
} from './job-tasks.dto';
import { JobTasksService } from './job-tasks.service';
import { Request } from 'express';
import { SamlUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UserGuard } from '../auth/user.guard';
import {
  PessimisticLockGuard,
  ValidateLock,
} from '../lock/pessimistic-lock.guard';

@Controller('job-tasks')
@UseGuards(JwtAuthGuard, UserGuard)
export class JobTasksController {
  constructor(private readonly jobTasksService: JobTasksService) {}

  @Get()
  async list(@Query() params: JobTaskParams): Promise<JobTasksListResponse> {
    return this.jobTasksService.list(params);
  }

  @Get('exists')
  async existsByTitle(@Query('title') title: string): Promise<boolean> {
    return this.jobTasksService.hasByTitle(title);
  }

  @Get(':id/exists')
  async exists(@Param('id') id: string): Promise<boolean> {
    return this.jobTasksService.has(id);
  }

  @Get(':id/affected-job-descriptions-count')
  async getAffectedJobDescriptionsCount(
    @Param('id') id: string,
  ): Promise<number> {
    return this.jobTasksService.getAffectedJobDescriptionsCount(id);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<JobTask> {
    return this.jobTasksService.get(id);
  }

  @Post()
  async create(
    @Body() data: CreateJobTaskDto,
    @Req() req: Request & { user: SamlUser },
  ): Promise<JobTask> {
    return this.jobTasksService.create(data, req.user);
  }

  @Patch(':id')
  @UseGuards(PessimisticLockGuard)
  @ValidateLock('JobTask')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateJobTaskDto,
    @Req() req: Request & { user: SamlUser },
  ): Promise<JobTask> {
    return this.jobTasksService.set(id, data, req.user);
  }

  @Delete(':id')
  @UseGuards(PessimisticLockGuard)
  @ValidateLock('JobTask')
  async delete(
    @Param('id') id: string,
    @Req() req: Request & { user: SamlUser },
  ): Promise<void> {
    return this.jobTasksService.delete(id, req.user);
  }

  @Delete(':id/permanent')
  @UseGuards(AdminGuard)
  async permanentDeleteWithCleanup(
    @Param('id') id: string,
    @Req() req: Request & { user: SamlUser },
  ): Promise<void> {
    return this.jobTasksService.permanentDeleteWithCleanup(id, req.user);
  }

  @Patch(':id/restore')
  @UseGuards(AdminGuard)
  async restore(
    @Param('id') id: string,
    @Req() req: Request & { user: SamlUser },
  ): Promise<JobTask> {
    return this.jobTasksService.restore(id, req.user);
  }
}
