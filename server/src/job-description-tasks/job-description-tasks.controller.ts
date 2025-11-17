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
import { JobDescriptionTasksService } from './job-description-tasks.service';
import {
  CreateJobDescriptionTaskDto,
  JobDescriptionTaskParams,
  UpdateJobDescriptionTaskDto,
} from './job-description-tasks.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserGuard } from '../auth/user.guard';
import { Request } from 'express';
import { SamlUser } from '../auth/auth.service';

@Controller('job-description-tasks')
@UseGuards(JwtAuthGuard, UserGuard)
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
  async create(
    @Body() data: CreateJobDescriptionTaskDto,
    @Req() req: Request & { user: SamlUser },
  ) {
    const result = await this.jobDescriptionTasksService.create(data, req.user);
    return result;
  }

  @Patch(':id')
  async set(
    @Param('id') id: string,
    @Body() data: UpdateJobDescriptionTaskDto,
    @Req() req: Request & { user: SamlUser },
  ) {
    const result = await this.jobDescriptionTasksService.set(
      id,
      data,
      req.user,
    );
    return result;
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: Request & { user: SamlUser },
  ) {
    const result = await this.jobDescriptionTasksService.delete(id, req.user);
    return result;
  }
}
