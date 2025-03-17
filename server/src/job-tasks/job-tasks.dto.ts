export type CreateJobTaskDto = {
  title: string;
  text: string;
  metadata: Record<string, any>;
};

export type UpdateJobTaskDto = Partial<CreateJobTaskDto>;
