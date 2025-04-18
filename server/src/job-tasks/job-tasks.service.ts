import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobTask, Prisma } from '@prisma/client';
import {
  CreateJobTaskDto,
  UpdateJobTaskDto,
  JobTaskParams,
} from './job-tasks.dto';

const ADMIN_ID = '4016651';

@Injectable()
export class JobTasksService {
  constructor(private prisma: PrismaService) {}

  async list(params?: JobTaskParams): Promise<JobTask[]> {
    return this.prisma.jobTask.findMany({
      where: this.buildWhereClause(params),
      include: {
        tags: true,
        jobDescription: true,
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
        createdBy: { connect: { userId: ADMIN_ID } },
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
        updatedBy: { connect: { userId: ADMIN_ID } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    const jobTask = await this.get(id);
    await this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        deletedAt: new Date(),
        deletedBy: { connect: { userId: ADMIN_ID } },
      },
    });
  }

  private buildWhereClause(params?: JobTaskParams): Prisma.JobTaskWhereInput {
    const where: Prisma.JobTaskWhereInput = {
      deletedAt: params?.includeDeleted ? undefined : null,
    };

    if (params?.search) {
      where.OR = [
        {
          title: {
            contains: params.search,
          },
        },
        {
          tags: {
            some: {
              name: {
                contains: params.search,
              },
            },
          },
        },
      ];
    } else {
      if (params?.title) {
        where.title = {
          contains: params.title,
        };
      }

      if (params?.tags && params.tags.length > 0) {
        where.tags = {
          some: {
            name: {
              in: params.tags,
            },
          },
        };
      }
    }

    if (params?.metadata) {
      where.metadata = params.metadata;
    }

    return where;
  }
}
