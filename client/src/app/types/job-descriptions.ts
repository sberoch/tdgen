import { Tag } from './tag';
import { JobTask } from './job-tasks';

export type JobDescription = {
  id: number;
  title: string;
  metadata: Record<string, any>;
  tasks: JobTask[];
  tags: Tag[];
  formFields: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type CreateJobDescription = {
  title: string;
  metadata: Record<string, any>;
  tags: string[];
  formFields: Record<string, string>;
};

export type UpdateJobDescription = Partial<CreateJobDescription>;
