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
import { JobDescriptionTasksService } from './job-description-tasks.service';
import {
  CreateJobDescriptionTaskDto,
  JobDescriptionTaskParams,
  UpdateJobDescriptionTaskDto,
} from './job-description-tasks.dto';

@Controller('job-description-tasks')
export class JobDescriptionTasksController {
  constructor(
    private readonly jobDescriptionTasksService: JobDescriptionTasksService,
  ) {}

  @Get()
  async list(@Query() params: JobDescriptionTaskParams) {
    const result = await this.jobDescriptionTasksService.list(params);
    return result;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const result = await this.jobDescriptionTasksService.get(id);
    return result;
  }

  @Post()
  async create(@Body() data: CreateJobDescriptionTaskDto) {
    const result = await this.jobDescriptionTasksService.create(data);
    return result;
  }

  @Patch(':id')
  async set(
    @Param('id') id: string,
    @Body() data: UpdateJobDescriptionTaskDto,
  ) {
    const result = await this.jobDescriptionTasksService.set(id, data);
    return result;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.jobDescriptionTasksService.delete(id);
    return result;
  }
}
