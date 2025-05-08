export interface FormFieldValidation {
  name: string;
  value: string;
}

export interface FormField {
  headline?: string;
  type?: string;
  label?: string;
  name?: string;
  value?: string;
  validations?: FormFieldValidation[];
}
