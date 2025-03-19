export type CreateJobTaskDto = {
  title: string;
  text: string;
  jobDescriptionId?: number;
  metadata: Record<string, any>;
};

export type UpdateJobTaskDto = Partial<CreateJobTaskDto>;
