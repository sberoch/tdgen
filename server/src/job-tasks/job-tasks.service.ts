import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobTask, Prisma } from '@prisma/client';
import {
  CreateJobTaskDto,
  UpdateJobTaskDto,
  JobTaskParams,
  JobTasksListResponse,
} from './job-tasks.dto';

const USER_ID = '4016651';

@Injectable()
export class JobTasksService {
  constructor(private prisma: PrismaService) {}

  async list(params?: JobTaskParams): Promise<JobTasksListResponse> {
    const whereClause = this.buildWhereClause(params);

    const [tasks, totalCount] = await Promise.all([
      this.prisma.jobTask.findMany({
        where: whereClause,
        orderBy: {
          title: 'asc',
        },
        include: {
          tags: true,
          jobDescriptions: true,
        },
      }),
      this.prisma.jobTask.count(),
    ]);

    return { tasks, totalCount };
  }

  async get(id: string): Promise<JobTask> {
    const jobTask = await this.prisma.jobTask.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        jobDescriptions: true,
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

  async hasByTitle(title: string): Promise<boolean> {
    const jobTask = await this.prisma.jobTask.findUnique({
      where: { title, deletedAt: null },
    });
    return !!jobTask;
  }

  async create(data: CreateJobTaskDto): Promise<JobTask> {
    const { tags, ...rest } = data;
    return this.prisma.jobTask.create({
      data: {
        ...rest,
        tags: tags ? { create: tags.map((tag) => ({ name: tag })) } : undefined,
        createdBy: { connect: { userId: USER_ID } },
      },
      include: {
        tags: true,
      },
    });
  }

  async set(id: string, data: UpdateJobTaskDto): Promise<JobTask> {
    const jobTask = await this.get(id);
    const { tags, ...rest } = data;
    return this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        ...rest,
        tags: tags
          ? { deleteMany: {}, create: tags.map((tag) => ({ name: tag })) }
          : undefined,
        updatedBy: { connect: { userId: USER_ID } },
      },
      include: {
        tags: true,
        jobDescriptions: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    const jobTask = await this.get(id);
    await this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        deletedAt: new Date(),
        deletedBy: { connect: { userId: USER_ID } },
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
