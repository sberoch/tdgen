import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobTask } from '@prisma/client';
import { CreateJobTaskDto, UpdateJobTaskDto } from './job-tasks.dto';

@Injectable()
export class JobTasksService {
  constructor(private prisma: PrismaService) {}

  async list(): Promise<JobTask[]> {
    const jobTasks = await this.prisma.jobTask.findMany();
    return jobTasks;
  }

  async get(id: string): Promise<JobTask> {
    const jobTask = await this.prisma.jobTask.findUnique({
      where: { id: Number(id) },
    });
    if (!jobTask) {
      throw new NotFoundException('Job task not found');
    }
    return jobTask;
  }

  async has(id: string): Promise<boolean> {
    const jobTask = await this.prisma.jobTask.findUnique({
      where: { id: Number(id) },
    });
    return !!jobTask;
  }

  async create(data: CreateJobTaskDto): Promise<JobTask> {
    return this.prisma.jobTask.create({ data });
  }

  async set(id: string, data: UpdateJobTaskDto): Promise<JobTask> {
    const jobTask = await this.get(id);
    return this.prisma.jobTask.update({ where: { id: jobTask.id }, data });
  }

  async delete(id: string): Promise<void> {
    const jobTask = await this.get(id);
    await this.prisma.jobTask.delete({ where: { id: jobTask.id } });
  }
}
