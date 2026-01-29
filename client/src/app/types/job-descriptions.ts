import { Tag } from './tag';
import { JobDescriptionTask } from './job-description-tasks';
import { FormControl } from '@angular/forms';

export type JobDescriptionFormField = {
  key: string;
  value: string;
};

export type JobDescription = {
  id: number;
  title: string;
  weightedAverage: number;
  taskCount: number;
  metadata: Record<string, any>;
  tasks: JobDescriptionTask[];
  tags: Tag[];
  formFields: JobDescriptionFormField[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  deletedAt?: string;
  lockedAt?: string;
  lockedById?: string;
  lockExpiry?: string;
  isLockedForUsers?: boolean;
};

export type CreateJobDescription = {
  title: string;
  metadata: Record<string, any>;
  tags: string[];
  formFields: Record<string, string>;
};

export type UpdateJobDescription = Partial<CreateJobDescription> & {
  isLockedForUsers?: boolean;
};

export type JobDescriptionsListResponse = {
  jobDescriptions: JobDescription[];
  totalCount: number;
};

export type ExportJobDescriptionForm = {
  department: FormControl<string | null>;
  location: FormControl<string | null>;
  date: FormControl<string | null>;
  einstellung: FormControl<boolean | null>;
  versetzung: FormControl<boolean | null>;
  umsetzung: FormControl<boolean | null>;
  aufgabenaderung: FormControl<boolean | null>;
  sonstigesCheckbox: FormControl<boolean | null>;
  sonstigesInput: FormControl<string | null>;
  effectiveDate: FormControl<string | null>;
  beschaftigungsdienststelle: FormControl<string | null>;
  organisationseinheit: FormControl<string | null>;
  dienstpostennr: FormControl<string | null>;
  funktion: FormControl<string | null>;
  employeeName: FormControl<string | null>;
  workplaceStartDate: FormControl<string | null>;
  disabled: FormControl<string | null>;
  employmentScope: FormControl<string | null>;
  parttimeHours: FormControl<string | null>;
  periodStart: FormControl<string | null>;
  periodEnd: FormControl<string | null>;
  periodType: FormControl<string | null>;
  drawMode: FormControl<boolean | null>;
  bypassFormData: FormControl<boolean | null>;
};
