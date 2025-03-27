export type JobTask = {
  id: number;
  title: string;
  text: string;
  metadata: Record<string, any>;
  tags: string[];
  jobDescriptionId?: number;
  jobDescription?: JobDescription;
};

export type JobDescription = {
  id: number;
  title: string;
  metadata: Record<string, any>;
  tasks: JobTask[];
  tags: string[];
  formFields: Record<string, string>;
};

export type CreateJobDescription = {
  title: string;
  metadata: Record<string, any>;
  tags: string[];
  formFields: Record<string, string>;
};

export type Card = {
  classification: string;
  title: string;
  text: string;
  percentage: number;
};

const pastelColors = [
  '#ffebf0',
  '#e6f5ff',
  '#ffffe6',
  '#ebffeb',
  '#f5ebf5',
  '#fff0eb',
  '#ebfff0',
  '#faf5ff',
  '#fff5eb',
  '#f0ffff',
];

export const getNextPastelColor = (currentIndex: number): string => {
  return pastelColors[currentIndex % pastelColors.length];
};
