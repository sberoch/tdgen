import { JobTask } from '@prisma/client';

export type CreateJobTaskDto = {
  title: string;
  text: string;
  metadata: Record<string, any>;
  tags: string[];
};
export type UpdateJobTaskDto = Partial<CreateJobTaskDto>;

export type JobTaskParams = {
  title?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  includeDeleted?: boolean;
  search?: string;
  createdById?: string;
};

export type JobTasksListResponse = {
  tasks: JobTask[];
  totalCount: number;
};
