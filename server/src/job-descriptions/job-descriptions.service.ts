import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobDescription, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJobDescriptionDto,
  JobDescriptionParams,
  UpdateJobDescriptionDto,
  UpdateJobDescriptionPercentagesDto,
} from './job-descriptions.dto';
import { getWeightedPayGroupFromTasks } from './job-descriptions.utils';

const ADMIN_ID = '4016651';

@Injectable()
export class JobDescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: JobDescriptionParams): Promise<JobDescription[]> {
    const jobDescriptions = await this.prisma.jobDescription.findMany({
      where: this.buildWhereClause(params),
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
    });

    return jobDescriptions.map((jobDescription) => ({
      ...jobDescription,
      weightedAverage: getWeightedPayGroupFromTasks(jobDescription.tasks),
    }));
  }

  async get(id: string) {
    const jobDescription = await this.prisma.jobDescription.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        tags: true,
        formFields: true,
        tasks: {
          include: {
            jobTask: true,
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
          createdBy: { connect: { userId: ADMIN_ID } },
        },
        include: {
          tasks: {
            include: {
              jobTask: true,
            },
          },
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
    const updatedJobDescription = await this.prisma.jobDescription.update({
      where: { id: jobDescription.id },
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
        updatedBy: { connect: { userId: ADMIN_ID } },
      },
    });
    return {
      ...updatedJobDescription,
      weightedAverage: jobDescription.weightedAverage,
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
        deletedBy: { connect: { userId: ADMIN_ID } },
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
