import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { JobDescription } from '@prisma/client';
import { JobDescriptionsService } from './job-descriptions.service';
import {
  UpdateJobDescriptionDto,
  CreateJobDescriptionDto,
  JobDescriptionParams,
  UpdateJobDescriptionPercentagesDto,
  JobDescriptionsListResponse,
} from './job-descriptions.dto';

@Controller('job-descriptions')
export class JobDescriptionsController {
  constructor(
    private readonly jobDescriptionsService: JobDescriptionsService,
  ) {}

  @Get()
  async list(
    @Query() params: JobDescriptionParams,
  ): Promise<JobDescriptionsListResponse> {
    return this.jobDescriptionsService.list(params);
  }

  @Get('exists')
  async existsByTitle(@Query('title') title: string): Promise<boolean> {
    return this.jobDescriptionsService.hasByTitle(title);
  }

  @Get(':id/exists')
  async existsById(@Param('id') id: string): Promise<boolean> {
    return this.jobDescriptionsService.has(id);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<JobDescription> {
    return this.jobDescriptionsService.get(id);
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

  @Patch(':id/percentages')
  async updatePercentages(
    @Param('id') id: string,
    @Body() data: UpdateJobDescriptionPercentagesDto,
  ): Promise<JobDescription> {
    return this.jobDescriptionsService.setPercentages(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.jobDescriptionsService.delete(id);
  }
}
