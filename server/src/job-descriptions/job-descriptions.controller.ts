import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
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
import { Request, Response } from 'express';
import { join } from 'path';
import { SamlUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('job-descriptions')
@UseGuards(JwtAuthGuard)
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

  @Get(':id/download')
  downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'static',
      'TDGen_Form_4_30_018.pdf',
    );
    res.download(filePath);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<JobDescription> {
    return this.jobDescriptionsService.get(id);
  }

  @Post()
  async create(
    @Body() data: CreateJobDescriptionDto,
    @Req() req: Request & { user: SamlUser },
  ): Promise<JobDescription> {
    return this.jobDescriptionsService.create(data, req.user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateJobDescriptionDto,
    @Req() req: Request & { user: SamlUser },
  ): Promise<JobDescription> {
    return this.jobDescriptionsService.set(id, data, req.user);
  }

  @Patch(':id/percentages')
  async updatePercentages(
    @Param('id') id: string,
    @Body() data: UpdateJobDescriptionPercentagesDto,
  ): Promise<JobDescription> {
    return this.jobDescriptionsService.setPercentages(id, data);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: Request & { user: SamlUser },
  ): Promise<void> {
    return this.jobDescriptionsService.delete(id, req.user);
  }
}
