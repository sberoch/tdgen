export type CreateJobDescriptionTaskDto = {
  jobDescriptionId: number;
  jobTaskId: number;
  order: number;
  percentage: number;
};

export type UpdateJobDescriptionTaskDto = Partial<CreateJobDescriptionTaskDto>;

export type JobDescriptionTaskParams = {
  jobDescriptionId?: number;
  jobTaskId?: number;
  includeDeleted?: boolean;
};
