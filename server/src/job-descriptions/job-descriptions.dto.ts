export type CreateJobDescriptionDto = {
  title: string;
  metadata: Record<string, any>;
};

export type UpdateJobDescriptionDto = Partial<CreateJobDescriptionDto>;
