import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobTask } from '@prisma/client';
import { CreateJobTaskDto, UpdateJobTaskDto } from './job-tasks.dto';

const ADMIN_ID = 4016651;

@Injectable()
export class JobTasksService {
  constructor(private prisma: PrismaService) {}

  async list(): Promise<JobTask[]> {
    return this.prisma.jobTask.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        tags: true,
      },
    });
  }

  async get(id: string): Promise<JobTask> {
    const jobTask = await this.prisma.jobTask.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        jobDescription: true,
        tags: true,
      },
    });
    if (!jobTask) {
      throw new NotFoundException('Job task not found');
    }
    return jobTask;
  }

  async has(id: string): Promise<boolean> {
    const jobTask = await this.prisma.jobTask.findUnique({
      where: { id: Number(id), deletedAt: null },
    });
    return !!jobTask;
  }

  async create(data: CreateJobTaskDto): Promise<JobTask> {
    const { jobDescriptionId, tags, ...rest } = data;
    return this.prisma.jobTask.create({
      data: {
        ...rest,
        jobDescription: jobDescriptionId
          ? { connect: { id: jobDescriptionId } }
          : undefined,
        tags: { create: tags.map((tag) => ({ name: tag })) },
        createdBy: { connect: { id: ADMIN_ID } },
      },
    });
  }

  async set(id: string, data: UpdateJobTaskDto): Promise<JobTask> {
    const jobTask = await this.get(id);
    const { jobDescriptionId, tags, ...rest } = data;
    return this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        ...rest,
        jobDescription: jobDescriptionId
          ? { connect: { id: jobDescriptionId } }
          : undefined,
        tags: { create: tags?.map((tag) => ({ name: tag })) },
        updatedBy: { connect: { id: ADMIN_ID } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    const jobTask = await this.get(id);
    await this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        deletedAt: new Date(),
        deletedBy: { connect: { id: ADMIN_ID } },
      },
    });
  }
}
