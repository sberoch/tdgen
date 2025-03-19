import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import { JobDescription } from '@prisma/client';
import { JobDescriptionsService } from './job-descriptions.service';
import {
  UpdateJobDescriptionDto,
  CreateJobDescriptionDto,
} from './job-descriptions.dto';

@Controller('job-descriptions')
export class JobDescriptionsController {
  constructor(
    private readonly jobDescriptionsService: JobDescriptionsService,
  ) {}

  @Get()
  async list(): Promise<JobDescription[]> {
    return this.jobDescriptionsService.list();
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<JobDescription> {
    return this.jobDescriptionsService.get(id);
  }

  @Get(':id/exists')
  async exists(@Param('id') id: string): Promise<boolean> {
    return this.jobDescriptionsService.has(id);
  }

  @Post()
  async create(@Body() data: CreateJobDescriptionDto): Promise<JobDescription> {
    return this.jobDescriptionsService.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateJobDescriptionDto,
  ): Promise<JobDescription> {
    return this.jobDescriptionsService.set(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.jobDescriptionsService.delete(id);
  }
}
