import { JobDescription } from './job-descriptions';
import { JobTask } from './job-tasks';

export type JobDescriptionTask = {
  id: number;
  jobTaskId: number;
  jobDescriptionId: number;
  jobTask?: JobTask;
  jobDescription?: JobDescription;
  order: number;
  percentage: number;
};

export type CreateJobDescriptionTask = {
  jobTaskId: number;
  jobDescriptionId: number;
  order: number;
  percentage: number;
};

export type UpdateJobDescriptionTask = Partial<CreateJobDescriptionTask>;
