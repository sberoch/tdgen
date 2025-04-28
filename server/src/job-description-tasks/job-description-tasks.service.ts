import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobDescriptionTask, Prisma } from '@prisma/client';
import {
  CreateJobDescriptionTaskDto,
  UpdateJobDescriptionTaskDto,
  JobDescriptionTaskParams,
} from './job-description-tasks.dto';

@Injectable()
export class JobDescriptionTasksService {
  constructor(private prisma: PrismaService) {}

  async list(params?: JobDescriptionTaskParams): Promise<JobDescriptionTask[]> {
    return this.prisma.jobDescriptionTask.findMany({
      where: this.buildWhereClause(params),
      orderBy: {
        order: 'asc',
      },
      include: {
        jobDescription: true,
        jobTask: true,
      },
    });
  }

  async get(id: string): Promise<JobDescriptionTask> {
    const jobDescriptionTask = await this.prisma.jobDescriptionTask.findUnique({
      where: { id: Number(id) },
      include: {
        jobDescription: true,
        jobTask: true,
      },
    });
    if (!jobDescriptionTask) {
      throw new NotFoundException('Job description task association not found');
    }
    return jobDescriptionTask;
  }

  async create(data: CreateJobDescriptionTaskDto): Promise<JobDescriptionTask> {
    return this.prisma.jobDescriptionTask.create({
      data: {
        order: data.order,
        percentage: data.percentage,
        jobDescription: { connect: { id: data.jobDescriptionId } },
        jobTask: { connect: { id: data.jobTaskId } },
      },
      include: {
        jobDescription: true,
        jobTask: true,
      },
    });
  }

  async set(
    id: string,
    data: UpdateJobDescriptionTaskDto,
  ): Promise<JobDescriptionTask> {
    const jobDescriptionTask = await this.get(id);

    const updateData: Prisma.JobDescriptionTaskUpdateInput = {};

    if (data.order !== undefined) updateData.order = data.order;
    if (data.percentage !== undefined) updateData.percentage = data.percentage;
    if (data.jobDescriptionId !== undefined) {
      updateData.jobDescription = { connect: { id: data.jobDescriptionId } };
    }
    if (data.jobTaskId !== undefined) {
      updateData.jobTask = { connect: { id: data.jobTaskId } };
    }

    return this.prisma.jobDescriptionTask.update({
      where: { id: jobDescriptionTask.id },
      data: updateData,
      include: {
        jobDescription: true,
        jobTask: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    const jobDescriptionTask = await this.get(id);
    await this.prisma.jobDescriptionTask.delete({
      where: { id: jobDescriptionTask.id },
    });
  }

  private buildWhereClause(
    params?: JobDescriptionTaskParams,
  ): Prisma.JobDescriptionTaskWhereInput {
    const where: Prisma.JobDescriptionTaskWhereInput = {};

    if (params?.jobDescriptionId) {
      where.jobDescriptionId = params.jobDescriptionId;
    }

    if (params?.jobTaskId) {
      where.jobTaskId = params.jobTaskId;
    }

    return where;
  }
}
