import { JobTask } from '@prisma/client';

export type CreateJobTaskDto = {
  title: string;
  text: string;
  metadata: Record<string, any>;
  tags: string[];
};
export type UpdateJobTaskDto = Partial<CreateJobTaskDto> & {
  isLockedForUsers?: boolean;
};

export type JobTaskParams = {
  title?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  includeDeleted?: boolean;
  search?: string;
  createdById?: string;
  createdBefore?: string;
  createdAt?: string;
  createdAfter?: string;
  modifiedBefore?: string;
  modifiedAt?: string;
  modifiedAfter?: string;
  modifiedBy?: string;
  readonly?: string;
  paygroup?: string;
};

export type JobTasksListResponse = {
  tasks: JobTask[];
  totalCount: number;
};
