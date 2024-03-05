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

export type ValidationFormat = 'alphanumeric' | 'date' | 'email' | 'hexColor' | 'numeric' | 'url';

interface RootProperties<Required> {
  required?: Array<Required>;
  additionalProperties?: boolean;
}

interface StringType<Required> extends RootProperties<Required> {
  type: Extract<ValidationTypes, 'string'>;
  format?: ValidationFormat;
  items?: never;
  minValue?: never;
  maxValue?: never;
  minLength?: number;
  maxLength?: number;
  matchesPattern?: RegExp;
}

interface ArrayType<Required> extends RootProperties<Required> {
  type: Extract<ValidationTypes, 'array'>;
  format?: never;
  items?: { type: ValidationTypes };
  minValue?: never;
  maxValue?: never;
  minLength?: number;
  maxLength?: number;
  matchesPattern?: never;
}

interface NumberType<Required> extends RootProperties<Required> {
  type: Extract<ValidationTypes, 'number'>;
  format?: never;
  items?: never;
  minValue?: number;
  maxValue?: number;
  minLength?: never;
  maxLength?: never;
  matchesPattern?: never;
}

interface RestType<Required> extends RootProperties<Required> {
  type: Exclude<ValidationTypes, 'string' | 'number'>;
  format?: never;
  items?: never;
  minValue?: never;
  maxValue?: never;
  minLength?: never;
  maxLength?: never;
  matchesPattern?: never;
}

type AllTypes<Required> =
  | StringType<Required>
  | NumberType<Required>
  | RestType<Required>
  | ArrayType<Required>;

type KeysOfUnion<T> = T extends T ? keyof T : never;

type ExcludeFromAllTypes<T, K> = Exclude<K, KeysOfUnion<AllTypes<T>>>;

export interface RootDefinition<S extends { properties: any }> {
  properties: FirstLevelDefinition<S['properties']>;
}

export type FirstLevelDefinition<S> = RootProperties<
  Extract<ExcludeFromAllTypes<S, keyof S>, string>
> & {
    [Key in keyof S as ExcludeFromAllTypes<S, Key>]: SchemaDefinition<S[Key]>;
  };

export type SchemaDefinition<S> = AllTypes<Extract<ExcludeFromAllTypes<S, keyof S>, string>> & {
  [Key in keyof S as ExcludeFromAllTypes<S, Key>]: SchemaDefinition<S[Key]>;
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
