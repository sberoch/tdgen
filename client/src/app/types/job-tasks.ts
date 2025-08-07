import { JobDescriptionTask } from './job-description-tasks';
import { Tag } from './tag';

export type JobTask = {
  id: number;
  title: string;
  text: string;
  metadata: Record<string, any>;
  tags: Tag[];
  jobDescriptions?: JobDescriptionTask[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type CreateJobTask = {
  title: string;
  text: string;
  metadata: Record<string, any>;
  tags: string[];
};

export type UpdateJobTask = Partial<CreateJobTask>;

export type JobTasksListResponse = {
  tasks: JobTask[];
  totalCount: number;
};
