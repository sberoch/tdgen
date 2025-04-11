import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobDescription, Prisma } from '@prisma/client';
import {
  CreateJobDescriptionDto,
  JobDescriptionParams,
} from './job-descriptions.dto';
import { UpdateJobDescriptionDto } from './job-descriptions.dto';

const ADMIN_ID = '4016651';

@Injectable()
export class JobDescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: JobDescriptionParams): Promise<JobDescription[]> {
    return this.prisma.jobDescription.findMany({
      where: this.buildWhereClause(params),
      include: {
        tags: true,
        formFields: true,
        tasks: true,
      },
    });
  }

  async get(id: string): Promise<JobDescription> {
    const jobDescription = await this.prisma.jobDescription.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        tasks: true,
        tags: true,
        formFields: true,
      },
    });
    if (!jobDescription) {
      throw new NotFoundException('Job description not found');
    }
    return jobDescription;
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

  async create(data: CreateJobDescriptionDto): Promise<JobDescription> {
    const { tags, formFields, ...rest } = data;
    return this.prisma.jobDescription.create({
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
    });
  }

  async set(
    id: string,
    data: UpdateJobDescriptionDto,
  ): Promise<JobDescription> {
    const jobDescription = await this.get(id);
    const { tags, formFields, ...rest } = data;
    return this.prisma.jobDescription.update({
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
