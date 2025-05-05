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
  list(@Query() params: JobDescriptionTaskParams) {
    return this.jobDescriptionTasksService.list(params);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.jobDescriptionTasksService.get(id);
  }

  @Post()
  create(@Body() data: CreateJobDescriptionTaskDto) {
    return this.jobDescriptionTasksService.create(data);
  }

  @Patch(':id')
  set(@Param('id') id: string, @Body() data: UpdateJobDescriptionTaskDto) {
    return this.jobDescriptionTasksService.set(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.jobDescriptionTasksService.delete(id);
  }
}
