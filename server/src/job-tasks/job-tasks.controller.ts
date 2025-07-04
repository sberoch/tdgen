import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { JobTask } from '@prisma/client';
import {
  CreateJobTaskDto,
  UpdateJobTaskDto,
  JobTaskParams,
  JobTasksListResponse,
} from './job-tasks.dto';
import { JobTasksService } from './job-tasks.service';

@Controller('job-tasks')
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
  async create(@Body() data: CreateJobTaskDto): Promise<JobTask> {
    return this.jobTasksService.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateJobTaskDto,
  ): Promise<JobTask> {
    return this.jobTasksService.set(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.jobTasksService.delete(id);
  }
}
