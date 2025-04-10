import { JobDescription } from './job-descriptions';

export type JobTask = {
  id: number;
  title: string;
  text: string;
  metadata: Record<string, any>;
  tags: string[];
  jobDescriptionId?: number;
  jobDescription?: JobDescription;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};
