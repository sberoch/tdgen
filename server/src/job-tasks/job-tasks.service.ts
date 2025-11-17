import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobTask, Prisma } from '@prisma/client';
import { SamlUser } from '../auth/auth.service';
import { EventsService } from '../events/events.service';
import { calculateAdjustedPercentages } from '../job-description-tasks/job-description-tasks.utils';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJobTaskDto,
  JobTaskParams,
  JobTasksListResponse,
  UpdateJobTaskDto,
} from './job-tasks.dto';

@Injectable()
export class JobTasksService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

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
    const jobTask = await this.prisma.jobTask.create({
      data: {
        ...rest,
        tags: tags ? { create: tags.map((tag) => ({ name: tag })) } : undefined,
        createdById: user.id,
      },
      include: {
        tags: true,
      },
    });

    // Emit event
    this.eventsService.broadcastEvent({
      type: 'job-task:created',
      data: jobTask,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return jobTask;
  }

  async set(
    id: string,
    data: UpdateJobTaskDto,
    user: SamlUser,
  ): Promise<JobTask> {
    const jobTask = await this.get(id);
    const { tags, ...rest } = data;
    const updatedJobTask = await this.prisma.jobTask.update({
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

    // Emit event
    this.eventsService.broadcastEvent({
      type: 'job-task:updated',
      data: updatedJobTask,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return updatedJobTask;
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
    const deletedDate = new Date();
    await this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        deletedAt: deletedDate,
        deletedById: user.id,
      },
    });

    // Emit event
    this.eventsService.broadcastEvent({
      type: 'job-task:deleted',
      data: {
        ...jobTask,
        deletedAt: deletedDate,
        deletedById: user.id,
      },
      userId: user.id,
      timestamp: deletedDate.toISOString(),
    });
  }

  async permanentDeleteWithCleanup(id: string, user: SamlUser): Promise<void> {
    const jobTask = await this.prisma.jobTask.findUnique({
      where: { id: Number(id) },
      include: {
        jobDescriptions: {
          include: {
            jobDescription: true,
          },
        },
        tags: true,
      },
    });

    if (!jobTask) {
      throw new NotFoundException('Job task not found');
    }

    await this.prisma.$transaction(async (prismaTx) => {
      // Get ALL affected job description IDs (including soft-deleted ones)
      const affectedJobDescriptionIds = jobTask.jobDescriptions.map(
        (jdt) => jdt.jobDescriptionId,
      );

      // Remove task from all job descriptions
      await prismaTx.jobDescriptionTask.deleteMany({
        where: { jobTaskId: jobTask.id },
      });

      // Recalculate percentages for ALL affected job descriptions
      for (const jobDescriptionId of affectedJobDescriptionIds) {
        const remainingTasks = await prismaTx.jobDescriptionTask.findMany({
          where: { jobDescriptionId },
          orderBy: { order: 'asc' },
        });

        if (remainingTasks.length > 0) {
          // Get current percentages
          const currentPercentages = remainingTasks.map(
            (task) => task.percentage,
          );

          // Recalculate to sum to 100%
          const adjustedPercentages = calculateAdjustedPercentages(
            remainingTasks.length,
            currentPercentages,
          );

          // Update each remaining task with new percentage
          for (let i = 0; i < remainingTasks.length; i++) {
            await prismaTx.jobDescriptionTask.update({
              where: { id: remainingTasks[i].id },
              data: { percentage: adjustedPercentages[i] },
            });
          }
        }
      }

      // Update timestamps for ALL affected job descriptions
      if (affectedJobDescriptionIds.length > 0) {
        await prismaTx.jobDescription.updateMany({
          where: { id: { in: affectedJobDescriptionIds } },
          data: {
            updatedAt: new Date(),
            updatedById: user.id,
          },
        });
      }

      // Finally delete the job task
      await prismaTx.jobTask.delete({
        where: { id: jobTask.id },
      });
    });

    // Emit event
    this.eventsService.broadcastEvent({
      type: 'job-task:permanent-deleted',
      data: jobTask,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  }

  async restore(id: string, user: SamlUser): Promise<JobTask> {
    const jobTask = await this.prisma.jobTask.findUnique({
      where: { id: Number(id) },
      include: {
        tags: true,
        jobDescriptions: {
          include: {
            jobDescription: true,
          },
        },
      },
    });

    if (!jobTask) {
      throw new NotFoundException('Job task not found');
    }

    if (!jobTask.deletedAt) {
      throw new BadRequestException('Job task is not deleted');
    }

    const restoredJobTask = await this.prisma.jobTask.update({
      where: { id: jobTask.id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: user.id,
      },
      include: {
        tags: true,
        jobDescriptions: {
          include: {
            jobDescription: true,
          },
        },
      },
    });

    // Emit event
    this.eventsService.broadcastEvent({
      type: 'job-task:restored',
      data: restoredJobTask,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return restoredJobTask;
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

    if (params?.createdById) {
      where.createdById = params.createdById;
    }

    return where;
  }
}
