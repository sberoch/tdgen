import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobDescription } from '@prisma/client';
import { CreateJobDescriptionDto } from './job-descriptions.dto';
import { UpdateJobDescriptionDto } from './job-descriptions.dto';

@Injectable()
export class JobDescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<JobDescription[]> {
    return this.prisma.jobDescription.findMany();
  }

  async get(id: string): Promise<JobDescription> {
    const jobDescription = await this.prisma.jobDescription.findUnique({
      where: { id: Number(id) },
      include: { tasks: true },
    });
    if (!jobDescription) {
      throw new NotFoundException('Job description not found');
    }
    return jobDescription;
  }

  async has(id: string): Promise<boolean> {
    const jobDescription = await this.prisma.jobDescription.findUnique({
      where: { id: Number(id) },
    });
    return !!jobDescription;
  }

  async create(data: CreateJobDescriptionDto): Promise<JobDescription> {
    return this.prisma.jobDescription.create({ data });
  }

  async set(
    id: string,
    data: UpdateJobDescriptionDto,
  ): Promise<JobDescription> {
    const jobDescription = await this.get(id);
    return this.prisma.jobDescription.update({
      where: { id: jobDescription.id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const jobDescription = await this.get(id);
    await this.prisma.jobDescription.delete({
      where: { id: jobDescription.id },
    });
  }
}
