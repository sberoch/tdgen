export type CreateJobTaskDto = {
  title: string;
  text: string;
  jobDescriptionId?: number;
  metadata: Record<string, any>;
  tags: string[];
};

export type UpdateJobTaskDto = Partial<CreateJobTaskDto>;
