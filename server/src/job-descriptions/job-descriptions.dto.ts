import { JobDescription } from '@prisma/client';

export type CreateJobDescriptionDto = {
  title: string;
  metadata: Record<string, any>;
  formFields: Record<string, string>;
  tags: string[];
};

export type UpdateJobDescriptionDto = Partial<CreateJobDescriptionDto>;

export type JobDescriptionParams = {
  title?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  includeDeleted?: boolean;
  search?: string;
  createdById?: string;
};

export type UpdateJobDescriptionPercentagesDto = {
  taskPercentages: {
    taskId: number;
    percentage: number;
  }[];
};

export type JobDescriptionsListResponse = {
  jobDescriptions: (Omit<JobDescription, 'tasks'> & {
    weightedAverage: number;
    taskCount: number;
  })[];
  totalCount: number;
};
