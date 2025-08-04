import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobTask, Prisma } from '@prisma/client';
import {
  CreateJobTaskDto,
  UpdateJobTaskDto,
  JobTaskParams,
  JobTasksListResponse,
} from './job-tasks.dto';
import { SamlUser } from '../auth/auth.service';

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
      where: { id: Number(id) },
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

  async create(data: CreateJobTaskDto, user: SamlUser): Promise<JobTask> {
    const { tags, ...rest } = data;
    return this.prisma.jobTask.create({
      data: {
        ...rest,
        tags: tags ? { create: tags.map((tag) => ({ name: tag })) } : undefined,
        createdById: user.id,
      },
      include: {
        tags: true,
      },
    });
  }

  async set(
    id: string,
    data: UpdateJobTaskDto,
    user: SamlUser,
  ): Promise<JobTask> {
    const jobTask = await this.get(id);
    const { tags, ...rest } = data;
    return this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        ...rest,
        tags: tags
          ? { deleteMany: {}, create: tags.map((tag) => ({ name: tag })) }
          : undefined,
        updatedById: user.id,
      },
      include: {
        tags: true,
        jobDescriptions: true,
      },
    });
  }

  async getAffectedJobDescriptionsCount(id: string): Promise<number> {
    return this.prisma.jobDescriptionTask.count({
      where: {
        jobTaskId: Number(id),
        jobDescription: {
          deletedAt: null,
        },
      },
    });
  }

  async delete(id: string, user: SamlUser): Promise<void> {
    const jobTask = await this.get(id);
    await this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
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
          text: {
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
