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
    console.time('list');
    const result = await this.jobDescriptionTasksService.list(params);
    console.timeEnd('list');
    return result;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    console.time('get');
    const result = await this.jobDescriptionTasksService.get(id);
    console.timeEnd('get');
    return result;
  }

  @Post()
  async create(@Body() data: CreateJobDescriptionTaskDto) {
    console.time('create');
    const result = await this.jobDescriptionTasksService.create(data);
    console.timeEnd('create');
    return result;
  }

  @Patch(':id')
  async set(
    @Param('id') id: string,
    @Body() data: UpdateJobDescriptionTaskDto,
  ) {
    console.time('set');
    const result = await this.jobDescriptionTasksService.set(id, data);
    console.timeEnd('set');
    return result;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    console.time('delete');
    const result = await this.jobDescriptionTasksService.delete(id);
    console.timeEnd('delete');
    return result;
  }
}
