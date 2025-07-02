import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJobDescriptionDto,
  JobDescriptionParams,
  UpdateJobDescriptionDto,
  UpdateJobDescriptionPercentagesDto,
  JobDescriptionsListResponse,
} from './job-descriptions.dto';
import { getWeightedPayGroupFromTasks } from './job-descriptions.utils';

const USER_ID = '4016651';

@Injectable()
export class JobDescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    params?: JobDescriptionParams,
  ): Promise<JobDescriptionsListResponse> {
    const whereClause = this.buildWhereClause(params);
    const [jobDescriptions, totalCount] = await Promise.all([
      this.prisma.jobDescription.findMany({
        where: whereClause,
        orderBy: {
          title: 'asc',
        },
        include: {
          tags: true,
          formFields: true,
          tasks: {
            include: {
              jobTask: true,
            },
          },
        },
      }),
      this.prisma.jobDescription.count(),
    ]);

    const jobDescriptionsWithWeightedAverage = jobDescriptions.map(
      (jobDescription) => {
        const { tasks, ...rest } = jobDescription;
        try {
          const weightedAverage = getWeightedPayGroupFromTasks(tasks);
          return {
            ...rest,
            weightedAverage,
          };
        } catch (error) {
          console.error(error);
          return { ...rest, weightedAverage: 0 };
        }
      },
    );

    return { jobDescriptions: jobDescriptionsWithWeightedAverage, totalCount };
  }

  async get(id: string) {
    const jobDescription = await this.prisma.jobDescription.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        tags: true,
        formFields: true,
        tasks: {
          include: {
            jobTask: {
              include: {
                tags: true,
              },
            },
          },
        },
      },
    });
    if (!jobDescription) {
      throw new NotFoundException('Job description not found');
    }
    try {
      const weightedAverage = getWeightedPayGroupFromTasks(
        jobDescription.tasks,
      );
      return { ...jobDescription, weightedAverage };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async has(id: string): Promise<boolean> {
    const jobDescription = await this.prisma.jobDescription.findUnique({
      where: { id: Number(id), deletedAt: null },
    });
    return !!jobDescription;
  }

  async hasByTitle(title: string): Promise<boolean> {
    const jobDescription = await this.prisma.jobDescription.findUnique({
      where: { title, deletedAt: null },
    });
    return !!jobDescription;
  }

  async create(data: CreateJobDescriptionDto) {
    const { tags, formFields, ...rest } = data;
    try {
      const jobDescription = await this.prisma.jobDescription.create({
        data: {
          ...rest,
          tags: { create: tags?.map((tag) => ({ name: tag })) },
          formFields: {
            create: formFields
              ? Object.entries(formFields).map(([key, value]) => ({
                  key,
                  value,
                }))
              : undefined,
          },
          createdBy: { connect: { userId: USER_ID } },
        },
        include: {
          tasks: {
            include: {
              jobTask: true,
            },
          },
          formFields: true,
          tags: true,
        },
      });
      return { ...jobDescription, weightedAverage: 0 };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async set(id: string, data: UpdateJobDescriptionDto) {
    const jobDescription = await this.get(id);
    const { tags, formFields, ...rest } = data;

    const updatedJobDescription = await this.prisma.$transaction(
      async (prismaTx) => {
        await prismaTx.jobDescriptionFormField.deleteMany({
          where: { jobDescriptionId: jobDescription.id },
        });

        return prismaTx.jobDescription.update({
          where: { id: jobDescription.id },
          data: {
            ...rest,
            tags: tags
              ? { deleteMany: {}, create: tags.map((tag) => ({ name: tag })) }
              : undefined,
            formFields: formFields
              ? {
                  create: Object.entries(formFields).map(([key, value]) => ({
                    key,
                    value,
                  })),
                }
              : undefined,
            updatedBy: { connect: { userId: USER_ID } },
          },
          include: {
            tasks: {
              include: {
                jobTask: true,
              },
            },
            formFields: true,
            tags: true,
          },
        });
      },
    );

    const finalWeightedAverage = getWeightedPayGroupFromTasks(
      updatedJobDescription.tasks,
    );

    return {
      ...updatedJobDescription,
      weightedAverage: finalWeightedAverage,
    };
  }

  async setPercentages(id: string, data: UpdateJobDescriptionPercentagesDto) {
    const jobDescription = await this.get(id);
    const currentJDTasks = jobDescription.tasks;
    for (let i = 0; i < currentJDTasks.length; i++) {
      const jobDescriptionTaskId = currentJDTasks[i].id;
      const percentage = data.taskPercentages.find(
        (task) => task.taskId === jobDescriptionTaskId,
      )?.percentage;
      if (!percentage) {
        throw new BadRequestException('Percentage is required');
      }
      await this.prisma.jobDescriptionTask.update({
        where: { id: jobDescriptionTaskId },
        data: { percentage },
      });
    }
    return await this.get(id);
  }

  async delete(id: string): Promise<void> {
    const jobDescription = await this.get(id);
    await this.prisma.jobDescription.update({
      where: { id: jobDescription.id },
      data: {
        deletedAt: new Date(),
        deletedBy: { connect: { userId: USER_ID } },
      },
    });
  }

  private buildWhereClause(
    params?: JobDescriptionParams,
  ): Prisma.JobDescriptionWhereInput {
    const where: Prisma.JobDescriptionWhereInput = {
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
