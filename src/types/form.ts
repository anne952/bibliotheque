export interface FormFieldBase {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'checkbox' | 'select';
  required: boolean;
  placeholder?: string;
}

export interface TextFormField extends FormFieldBase {
  type: 'text' | 'email' | 'tel';
}

export interface NumberFormField extends FormFieldBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface DateFormField extends FormFieldBase {
  type: 'date';
  minDate?: string;
  maxDate?: string;
}

export interface CheckboxFormField extends FormFieldBase {
  type: 'checkbox';
  checked?: boolean;
}

export interface SelectFormField extends FormFieldBase {
  type: 'select';
  options?: Array<{ value: string; label: string }>;
}

export type FormField = TextFormField | NumberFormField | DateFormField | CheckboxFormField | SelectFormField;

export interface FormPage {
  title: string;
  fields: FormField[];
}

export type FormPagesConfig = Record<string, FormPage[]>;