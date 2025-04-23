import { JobDescription } from './job-descriptions';
import { Tag } from './tag';
export type JobTask = {
  id: number;
  title: string;
  text: string;
  metadata: Record<string, any>;
  tags: Tag[];
  jobDescriptionId?: number;
  jobDescription?: JobDescription;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type CreateJobTask = {
  title: string;
  text: string;
  metadata: Record<string, any>;
  tags: string[];
  jobDescriptionId?: number;
};

export type UpdateJobTask = Partial<CreateJobTask>;
