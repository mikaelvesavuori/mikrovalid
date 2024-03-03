export type Result = {
  key: string;
  value: ValidationValue;
  success: boolean;
  error: string;
};

export type ValidationResult = {
  success: boolean;
  error?: string;
};

export type ValidationSchema = {
  properties: ValidationProperties;
  required?: string[];
  additionalProperties?: boolean;
};

export type ValidationProperties = {
  [key: string]: ValidationValue;
};

export type ValidationValue =
  | string
  | string[]
  | number
  | number[]
  | boolean
  | boolean[]
  | Record<string, any>
  | Record<string, any>[];

export type ValidationTypes = 'string' | 'number' | 'boolean' | 'object' | 'array';

export type ValidationError = Result;
