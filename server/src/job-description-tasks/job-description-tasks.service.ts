import { Injectable, NotFoundException } from '@nestjs/common';
import { JobDescriptionTask, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJobDescriptionTaskDto,
  JobDescriptionTaskParams,
  UpdateJobDescriptionTaskDto,
} from './job-description-tasks.dto';
import { calculateAdjustedPercentages } from './job-description-tasks.utils';
import { JobDescriptionsService } from '../job-descriptions/job-descriptions.service';
import { EventsService } from '../events/events.service';
import { SamlUser } from '../auth/auth.service';

const NEW_TASK_ORDER = -1;

@Injectable()
export class JobDescriptionTasksService {
  constructor(
    private prisma: PrismaService,
    private jobDescriptionsService: JobDescriptionsService,
    private eventsService: EventsService,
  ) {}

  async list(params?: JobDescriptionTaskParams): Promise<JobDescriptionTask[]> {
    return this.prisma.jobDescriptionTask.findMany({
      where: this.buildWhereClause(params),
      orderBy: {
        order: 'asc',
      },
      include: {
        jobDescription: true,
        jobTask: true,
      },
    });
  }

  async get(id: string): Promise<JobDescriptionTask> {
    const jobDescriptionTask = await this.prisma.jobDescriptionTask.findUnique({
      where: { id: Number(id) },
      include: {
        jobDescription: true,
        jobTask: true,
      },
    });
    if (!jobDescriptionTask) {
      throw new NotFoundException('Job description task association not found');
    }
    return jobDescriptionTask;
  }

  async create(data: CreateJobDescriptionTaskDto, user: SamlUser) {
    const previousJobDescriptionTasks = await this.list({
      jobDescriptionId: data.jobDescriptionId,
    });
    const previousJobDescriptionTasksPercentages =
      previousJobDescriptionTasks.map((task) => task.percentage);
    const newTask = await this.prisma.jobDescriptionTask.create({
      data: {
        order: data.order,
        percentage: data.percentage,
        jobDescription: { connect: { id: data.jobDescriptionId } },
        jobTask: { connect: { id: data.jobTaskId } },
      },
      include: {
        jobDescription: true,
        jobTask: true,
      },
    });

    await this.adjustTaskPercentages(
      data.jobDescriptionId,
      previousJobDescriptionTasksPercentages,
      user,
    );
    await this.reorderTasksAfterChange(
      data.jobDescriptionId,
      newTask.id,
      data.order,
      NEW_TASK_ORDER,
    );

    const updatedJobDescription = await this.jobDescriptionsService.get(
      data.jobDescriptionId.toString(),
    );

    // Emit event
    this.eventsService.broadcastEvent({
      type: 'job-description-task:created',
      data: {
        jobDescriptionId: data.jobDescriptionId,
        jobTaskId: data.jobTaskId,
        jobDescription: updatedJobDescription,
      },
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return updatedJobDescription;
  }

  async set(id: string, data: UpdateJobDescriptionTaskDto, user: SamlUser) {
    const jobDescriptionTask = await this.get(id);
    const updateData: Prisma.JobDescriptionTaskUpdateInput = {};
    const isOrderChanged =
      data.order !== undefined && data.order !== jobDescriptionTask.order;
    const oldOrder = jobDescriptionTask.order;

    if (data.order !== undefined) updateData.order = data.order;
    if (data.percentage !== undefined) updateData.percentage = data.percentage;
    if (data.jobDescriptionId !== undefined) {
      updateData.jobDescription = { connect: { id: data.jobDescriptionId } };
    }
    if (data.jobTaskId !== undefined) {
      updateData.jobTask = { connect: { id: data.jobTaskId } };
    }

    if (isOrderChanged) {
      const jobDescriptionId =
        data.jobDescriptionId ?? jobDescriptionTask.jobDescriptionId;

      const updatedTask = await this.prisma.jobDescriptionTask.update({
        where: { id: jobDescriptionTask.id },
        data: updateData,
        include: {
          jobDescription: true,
          jobTask: true,
        },
      });

      await this.reorderTasksAfterChange(
        jobDescriptionId,
        updatedTask.id,
        data.order!,
        oldOrder,
      );
    }

    const updatedJobDescription = await this.jobDescriptionsService.get(
      jobDescriptionTask.jobDescriptionId.toString(),
    );

    // Emit events
    this.eventsService.broadcastEvent({
      type: 'job-description-task:updated',
      data: {
        jobDescriptionId: jobDescriptionTask.jobDescriptionId,
        jobDescriptionTaskId: Number(id),
        jobDescription: updatedJobDescription,
      },
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    if (isOrderChanged) {
      this.eventsService.broadcastEvent({
        type: 'job-description-task:reordered',
        data: {
          jobDescriptionId: jobDescriptionTask.jobDescriptionId,
          jobDescription: updatedJobDescription,
        },
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }

    return updatedJobDescription;
  }

  async delete(id: string, user: SamlUser) {
    const jobDescriptionTask = await this.get(id);
    const previousJobDescriptionTasks = await this.list({
      jobDescriptionId: jobDescriptionTask.jobDescriptionId,
    });
    const previousJobDescriptionTasksPercentages =
      previousJobDescriptionTasks.map((task) => task.percentage);
    const { jobDescriptionId, jobTaskId, order } = jobDescriptionTask;
    await this.prisma.jobDescriptionTask.delete({
      where: { id: jobDescriptionTask.id },
    });

    await this.adjustTaskPercentages(
      jobDescriptionId,
      previousJobDescriptionTasksPercentages,
      user,
    );
    await this.reorderTasksAfterDeletion(jobDescriptionId, order);

    const updatedJobDescription = await this.jobDescriptionsService.get(
      jobDescriptionId.toString(),
    );

    // Emit event
    this.eventsService.broadcastEvent({
      type: 'job-description-task:deleted',
      data: {
        jobDescriptionId,
        jobTaskId,
        jobDescription: updatedJobDescription,
      },
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return updatedJobDescription;
  }

  // Helper method to reorder tasks when one task's order changes
  private async reorderTasksAfterChange(
    jobDescriptionId: number,
    changedTaskId: number,
    newOrder: number,
    oldOrder: number,
  ): Promise<void> {
    // Get all tasks for this job description, ordered by current order
    const allTasks = await this.prisma.jobDescriptionTask.findMany({
      where: { jobDescriptionId },
      orderBy: { order: 'asc' },
    });

    // Skip if there's only one task
    if (allTasks.length <= 1) return;

    // Create a transaction to update all tasks at once
    const updates = allTasks
      .filter((task) => task.id !== changedTaskId) // Exclude the already updated task
      .map((task) => {
        let newTaskOrder = task.order;

        if (oldOrder === NEW_TASK_ORDER) {
          // This is a new task being inserted
          // Increment all tasks with order >= newOrder
          if (task.order >= newOrder) {
            newTaskOrder = task.order + 1;
          }
        } else if (oldOrder < newOrder) {
          // Moving task down (to a higher order number)
          // Decrement tasks between old position and new position
          if (task.order > oldOrder && task.order <= newOrder) {
            newTaskOrder = task.order - 1;
          }
        } else if (oldOrder > newOrder) {
          // Moving task up (to a lower order number)
          // Increment tasks between new position and old position
          if (task.order >= newOrder && task.order < oldOrder) {
            newTaskOrder = task.order + 1;
          }
        }

        return this.prisma.jobDescriptionTask.update({
          where: { id: task.id },
          data: { order: newTaskOrder },
        });
      });

    // Execute all updates in a transaction if there are any
    if (updates.length > 0) {
      await this.prisma.$transaction(updates);
    }
  }

  // Helper method to reorder tasks after a deletion
  private async reorderTasksAfterDeletion(
    jobDescriptionId: number,
    deletedOrder: number,
  ): Promise<void> {
    // Get all tasks for this job description with order greater than the deleted task
    const tasksToUpdate = await this.prisma.jobDescriptionTask.findMany({
      where: {
        jobDescriptionId,
        order: { gt: deletedOrder },
      },
      orderBy: { order: 'asc' },
    });

    // Skip if no tasks need updating
    if (tasksToUpdate.length === 0) return;

    // Create a transaction to update all tasks at once
    const updates = tasksToUpdate.map((task) => {
      return this.prisma.jobDescriptionTask.update({
        where: { id: task.id },
        data: { order: task.order - 1 }, // Decrement order by 1
      });
    });

    // Execute all updates in a transaction
    await this.prisma.$transaction(updates);
  }

  // Helper method to adjust task percentages
  private async adjustTaskPercentages(
    jobDescriptionId: number,
    previousJobDescriptionTasksPercentages: number[],
    user: SamlUser,
  ): Promise<void> {
    const jobDescriptionTasks = await this.list({
      jobDescriptionId,
    });
    const percentages = calculateAdjustedPercentages(
      jobDescriptionTasks.length,
      previousJobDescriptionTasksPercentages,
    );
    for (let i = 0; i < jobDescriptionTasks.length; i++) {
      await this.prisma.jobDescriptionTask.update({
        where: { id: jobDescriptionTasks[i].id },
        data: { percentage: percentages[i] },
      });
    }

    // Emit event
    this.eventsService.broadcastEvent({
      type: 'job-description-task:percentage-changed',
      data: {
        jobDescriptionId,
        percentages: percentages.map((p, i) => ({
          taskId: jobDescriptionTasks[i].id,
          percentage: p,
        })),
      },
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  }

  private buildWhereClause(
    params?: JobDescriptionTaskParams,
  ): Prisma.JobDescriptionTaskWhereInput {
    const where: Prisma.JobDescriptionTaskWhereInput = {};

    if (params?.jobDescriptionId) {
      where.jobDescriptionId = params.jobDescriptionId;
    }

    if (params?.jobTaskId) {
      where.jobTaskId = params.jobTaskId;
    }

    return where;
  }
}
