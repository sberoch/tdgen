import { Tag } from './tag';
import { JobDescriptionTask } from './job-description-tasks';

export type JobDescriptionFormField = {
  key: string;
  value: string;
};

export type JobDescription = {
  id: number;
  title: string;
  weightedAverage: number;
  metadata: Record<string, any>;
  tasks: JobDescriptionTask[];
  tags: Tag[];
  formFields: JobDescriptionFormField[];
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
