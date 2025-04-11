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
} from './job-tasks.dto';
import { JobTasksService } from './job-tasks.service';

@Controller('job-tasks')
export class JobTasksController {
  constructor(private readonly jobTasksService: JobTasksService) {}

  @Get()
  async list(@Query() params: JobTaskParams): Promise<JobTask[]> {
    return this.jobTasksService.list(params);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<JobTask> {
    return this.jobTasksService.get(id);
  }

  @Get(':id/exists')
  async exists(@Param('id') id: string): Promise<boolean> {
    return this.jobTasksService.has(id);
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
