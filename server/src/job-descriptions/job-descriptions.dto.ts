export type CreateJobDescriptionDto = {
  title: string;
  metadata: Record<string, any>;
  formFields: Record<string, string>;
  tags: string[];
};

export type UpdateJobDescriptionDto = Partial<CreateJobDescriptionDto>;
