import type {
  FirstLevelDefinition,
  PropertySchema,
  Result,
  RootDefinition,
  SchemaDefinition,
  ValidationError,
  ValidationFormat,
  ValidationSchema,
  ValidationTypes,
  ValidationValue
} from '../interfaces/MikroValid.js';

const RE_ALPHANUMERIC = /^[a-zA-Z0-9]+$/;
const RE_NUMERIC = /^-?\d+(\.\d+)?$/;
const RE_EMAIL = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_URL = /^(https?):\/\/[^\s$.?#].[^\s]*$/;
const RE_HEXCOLOR = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i;

interface SchemaMeta {
  propKeys: string[];
  requiredSet: Set<string>;
  requiredKeys: string[];
  additionalProperties: boolean;
  schemaKeys: string[];
  propValidators: PropValidator[];
  propMetas: (SchemaMeta | null)[];
  propItems: (SchemaDefinition<any> | null)[];
  propItemsValidators: (PropValidator | null)[];
  propSchemas: Record<string, any>[];
  propValidatorMap: Map<string, PropValidator>;
}

type PropValidator = (path: string, value: ValidationValue, results: Result[]) => void;

function isPlainObject(input: any): boolean {
  return (
    input !== null &&
    typeof input === 'object' &&
    !Array.isArray(input) &&
    Object.getPrototypeOf(input) === Object.prototype
  );
}

function compilePropValidator(propSchema: Record<string, any>): PropValidator {
  const type = propSchema.type;
  const format = propSchema.format;
  const minLength = propSchema.minLength;
  const maxLength = propSchema.maxLength;
  const minValue = propSchema.minValue;
  const maxValue = propSchema.maxValue;
  const matchesPattern = propSchema.matchesPattern;

  let typeChecker: ((input: ValidationValue) => boolean) | null = null;
  if (type) {
    const types: string[] = Array.isArray(type) ? type : [type];
    const checkers = types.map((t) => {
      switch (t) {
        case 'string':
          return (input: ValidationValue) => typeof input === 'string';
        case 'number':
          return (input: ValidationValue) =>
            typeof input === 'number' && !Number.isNaN(input as number);
        case 'boolean':
          return (input: ValidationValue) => typeof input === 'boolean';
        case 'object':
          return (input: ValidationValue) => isPlainObject(input);
        case 'array':
          return (input: ValidationValue) => Array.isArray(input);
        default:
          return () => false;
      }
    });
    typeChecker = (input: ValidationValue) => checkers.some((c) => c(input));
  }

  let formatChecker: ((input: string) => boolean) | null = null;
  if (format) {
    switch (format) {
      case 'alphanumeric':
        formatChecker = (input) => RE_ALPHANUMERIC.test(input);
        break;
      case 'numeric':
        formatChecker = (input) => RE_NUMERIC.test(input);
        break;
      case 'email':
        formatChecker = (input) => RE_EMAIL.test(input);
        break;
      case 'date':
        formatChecker = (input) => RE_DATE.test(input);
        break;
      case 'url':
        formatChecker = (input) => RE_URL.test(input);
        break;
      case 'hexColor':
        formatChecker = (input) => RE_HEXCOLOR.test(input);
        break;
    }
  }

  return (path: string, value: ValidationValue, results: Result[]) => {
    if (typeChecker && !typeChecker(value))
      results.push({ key: path, value, success: false, error: 'Invalid type' });

    if (formatChecker && !formatChecker(value as string))
      results.push({ key: path, value, success: false, error: 'Invalid format' });

    if (minLength && !isMinLen(minLength, value))
      results.push({ key: path, value, success: false, error: 'Length too short' });

    if (maxLength && !isMaxLen(maxLength, value))
      results.push({ key: path, value, success: false, error: 'Length too long' });

    if (minValue && !isMinVal(minValue, value as number))
      results.push({ key: path, value, success: false, error: 'Value too small' });

    if (maxValue && !isMaxVal(maxValue, value as number))
      results.push({ key: path, value, success: false, error: 'Value too large' });

    if (matchesPattern && !matchesPattern.test(value as string))
      results.push({ key: path, value, success: false, error: 'Pattern does not match' });
  };
}

function isMinLen(minLength: number, input: ValidationValue) {
  if (Array.isArray(input)) return input.length >= minLength;
  return input?.toString().length >= minLength;
}

function isMaxLen(maxLength: number, input: ValidationValue) {
  if (Array.isArray(input)) return input.length <= maxLength;
  return input?.toString().length <= maxLength;
}

function isMinVal(minValue: number, input: number) {
  return input >= minValue;
}

function isMaxVal(maxValue: number, input: number) {
  return input <= maxValue;
}

function checkType(expected: ValidationTypes, input: ValidationValue): boolean {
  if (!Array.isArray(expected)) expected = [expected];
  return expected.some((type) => {
    switch (type) {
      case 'string':
        return typeof input === 'string';
      case 'number':
        return typeof input === 'number' && !Number.isNaN(input);
      case 'boolean':
        return typeof input === 'boolean';
      case 'object':
        return isPlainObject(input);
      case 'array':
        return Array.isArray(input);
      default:
        return false;
    }
  });
}

function checkFormat(expected: ValidationFormat, input: string): boolean {
  switch (expected) {
    case 'alphanumeric':
      return RE_ALPHANUMERIC.test(input);
    case 'numeric':
      return RE_NUMERIC.test(input);
    case 'email':
      return RE_EMAIL.test(input);
    case 'date':
      return RE_DATE.test(input);
    case 'url':
      return RE_URL.test(input);
    case 'hexColor':
      return RE_HEXCOLOR.test(input);
  }
}

export class MikroValid {
  /**
   * Toggle to silence (suppress) non-critical messages, such as warnings.
   */
  private readonly isSilent: boolean;

  private propertyPath: string = '';

  private metaCache = new WeakMap<object, SchemaMeta>();

  constructor(isSilent = false) {
    this.isSilent = isSilent;
  }

  private getMeta(schema: Record<string, any>): SchemaMeta {
    let meta = this.metaCache.get(schema);
    if (meta) return meta;

    const schemaKeys = Object.keys(schema);
    const propKeys: string[] = [];
    for (const key of schemaKeys) {
      if (key !== 'required' && key !== 'additionalProperties') propKeys.push(key);
    }

    const propValidators: PropValidator[] = [];
    const propMetas: (SchemaMeta | null)[] = [];
    const propItems: (SchemaDefinition<any> | null)[] = [];
    const propItemsValidators: (PropValidator | null)[] = [];
    const propSchemas: Record<string, any>[] = [];
    const propValidatorMap = new Map<string, PropValidator>();

    for (const key of propKeys) {
      const propSchema = schema[key];
      const isObj = typeof propSchema === 'object' && propSchema !== null;
      const validator = compilePropValidator(propSchema);
      propValidators.push(validator);
      propValidatorMap.set(key, validator);
      propMetas.push(isObj ? this.getMeta(propSchema) : null);
      const items = propSchema?.items ?? null;
      propItems.push(items);
      propItemsValidators.push(items ? compilePropValidator(items) : null);
      propSchemas.push(propSchema);
    }

    meta = {
      propKeys,
      requiredSet: new Set(schema.required || []),
      requiredKeys: schema.required || [],
      additionalProperties: schema.additionalProperties ?? true,
      schemaKeys,
      propValidators,
      propMetas,
      propItems,
      propItemsValidators,
      propSchemas,
      propValidatorMap
    };
    this.metaCache.set(schema, meta);
    return meta;
  }

  /**
   * @description MikroValid is a lightweight validator
   * that works both on the client and server.
   *
   * Provide a JSON object schema and your input and MikroValid
   * takes care of the rest.
   *
   * @example
   * import { MikroValid } from 'mikrovalid';
   *
   * const mikrovalid = new MikroValid();
   *
   * const schema = {
   *   properties: {
   *     personal: {
   *       name: { type: 'string' },
   *       required: ['name']
   *     },
   *     work: {
   *       office: { type: 'string' },
   *       currency: { type: 'string' },
   *       salary: { type: 'number' },
   *       required: ['office']
   *     },
   *     required: ['personal', 'work']
   *   }
   * };
   *
   * const input = {
   *   personal: {
   *     name: 'Sam Person'
   *   },
   *   work: {
   *     office: 'London',
   *     currency: 'GBP',
   *     salary: 10000
   *   }
   * };
   *
   * const { success, errors } = mikrovalid.test(schema, input);
   *
   * console.log('Was the test successful?', success);
   */
  public test<Schema extends { properties: any }>(
    schema: Schema & RootDefinition<Schema>,
    input: Record<string, any>
  ) {
    if (!input) throw new Error('Missing input!');

    this.updatePropertyPath();

    const { results, errors } = this.validate(schema.properties, input);
    const aggregatedErrors = this.compileErrors(results, errors);

    return {
      errors: aggregatedErrors,
      success: aggregatedErrors.length === 0
    };
  }

  /**
   * @description Aggregate errors into a flat array.
   */
  private compileErrors(results: Result[], errors: ValidationError[]): ValidationError[] {
    const resultErrors = results.filter((result: Result) => result.success === false);
    return errors.concat(resultErrors);
  }

  /**
   * @description This is the main recursive loop that checks
   * all fields/properties and any nested objects.
   */
  private validate<Schema extends Record<string, any>>(
    schema: FirstLevelDefinition<Schema>,
    input: Record<string, any>,
    results: Result[] = [],
    errors: ValidationError[] = []
  ) {
    const meta = this.getMeta(schema as Record<string, any>);

    errors = this.checkForRequiredKeysErrors(meta.requiredKeys, input, errors);
    errors = this.checkForDisallowedProperties(
      Object.keys(input),
      meta.schemaKeys,
      errors,
      meta.additionalProperties
    );

    for (let i = 0; i < meta.propKeys.length; i++) {
      const key = meta.propKeys[i];
      const isKeyRequired = meta.requiredSet.has(key);
      const propertyKey = meta.propSchemas[i];
      const inputKey: ValidationValue = input[key];
      const innerMeta = meta.propMetas[i];
      const innerAdditionalsOk = innerMeta?.additionalProperties ?? true;
      const innerSchemaKeys = innerMeta?.schemaKeys ?? [];
      const innerRequiredKeys = innerMeta?.requiredKeys ?? [];

      if (isKeyRequired) {
        errors = this.checkForRequiredKeysErrors(
          innerRequiredKeys,
          inputKey as Record<string, any>,
          errors
        );
      }

      if (this.isDefined(inputKey)) {
        this.handleValidationCompiled(
          key,
          inputKey,
          propertyKey,
          meta.propValidators[i],
          meta.propItems[i],
          meta.propItemsValidators[i],
          innerMeta ? innerMeta.propValidatorMap : new Map(),
          results
        );

        errors = this.checkForDisallowedProperties(
          Object.keys(inputKey),
          innerSchemaKeys,
          errors,
          innerAdditionalsOk
        );

        this.handleNestedObject(inputKey as Record<string, any>, propertyKey, results, errors);
      }
    }

    return { results, errors };
  }

  /**
   * @description Updates the internal `propertyPath` value. This is used
   * when outputting the full path to the key where any errors are found.
   */
  private updatePropertyPath(key?: string, startValue = '') {
    if (!key) {
      this.propertyPath = '';
      return;
    }

    if (startValue) this.propertyPath = startValue;

    this.propertyPath = `${this.propertyPath}.${key}`;

    if (this.propertyPath.startsWith('.'))
      this.propertyPath = this.propertyPath.substring(1, this.propertyPath.length);
  }

  /**
   * @description Checks if a value is actually defined as a non-null value.
   */
  private isDefined(value: unknown) {
    if (value === 0 && typeof value === 'number') return true;
    if (value === '' || typeof value === 'boolean') return true;
    return !!value;
  }

  /**
   * @description Checks if there are required keys and adds errors if needed.
   */
  private checkForRequiredKeysErrors(
    schema: string[],
    input: Record<string, any>,
    errors: ValidationError[]
  ) {
    if (!this.areRequiredKeysPresent(schema, input)) {
      const inputKeys = input ? Object.keys(input) : [];
      const missingKeys = this.findNonOverlappingElements(schema, inputKeys);

      const message =
        missingKeys.length > 0
          ? `Missing the required key: '${missingKeys.join(', ')}'!`
          : `Missing values for required keys: '${inputKeys.filter((key) => !input[key]).join(', ')}'!`;

      errors.push({
        key: '',
        value: input,
        success: false,
        error: message
      });
    }

    return errors;
  }

  /**
   * @description Checks if there are disallowed properties and adds errors if needed.
   */
  private checkForDisallowedProperties(
    inputKeys: string[],
    propertyKeys: string[],
    errors: ValidationError[],
    isAdditionalsOk: boolean
  ) {
    if (!isAdditionalsOk) {
      const additionals = this.findNonOverlappingElements(inputKeys, propertyKeys);
      if (additionals.length > 0)
        errors.push({
          key: `${propertyKeys}`,
          value: inputKeys,
          success: false,
          error: `Has additional (disallowed) properties: '${additionals.join(', ')}'!`
        });
    }

    return errors;
  }

  /**
   * @description Runs validation in the right way, based on whether the
   * input is an object or not. Uses pre-compiled validators.
   */
  private handleValidationCompiled(
    key: string,
    inputKey: ValidationValue,
    propertyKey: Record<string, any>,
    validator: PropValidator,
    itemsSchema: SchemaDefinition<any> | null,
    itemsValidator: PropValidator | null,
    validatorMap: Map<string, PropValidator>,
    results: Result[]
  ) {
    this.updatePropertyPath(key);

    validator(this.propertyPath, inputKey, results);

    if (Array.isArray(inputKey) && itemsSchema != null && itemsValidator) {
      for (const arrayItem of inputKey as unknown[]) {
        itemsValidator(this.propertyPath, arrayItem as ValidationValue, results);
      }
      this.updatePropertyPath();
    } else if (isPlainObject(inputKey)) {
      const objInput = inputKey as Record<string, any>;
      const keys = Object.keys(objInput);
      const currentPath = this.propertyPath;

      for (const innerKey of keys) {
        this.updatePropertyPath(innerKey, currentPath);

        const innerValue = objInput[innerKey];
        const innerSchema = propertyKey[innerKey];

        if (Array.isArray(innerValue) && innerSchema?.items != null) {
          const itemsSchema = innerSchema.items;
          for (const arrayItem of innerValue as unknown[]) {
            this.pushValidationErrors(
              this.propertyPath,
              itemsSchema,
              arrayItem as ValidationValue,
              results
            );
          }
          this.updatePropertyPath();
        } else {
          const innerValidator = validatorMap.get(innerKey);
          if (innerValidator) {
            innerValidator(this.propertyPath, innerValue, results);
          } else {
            this.pushValidationErrors(this.propertyPath, innerSchema, innerValue, results);
          }
        }
      }
    } else {
      this.updatePropertyPath();
    }
  }

  /**
   * @description Check for nested objects and handle them.
   * @note Currently, this skips checking array contents.
   */
  private handleNestedObject(
    inputKey: Record<string, any>,
    propertyKey: Record<string, any>,
    results: Result[],
    errors: ValidationError[]
  ) {
    if (isPlainObject(inputKey)) {
      for (const nested of Object.keys(inputKey)) {
        const nextSchema = propertyKey[nested];
        const nextInput = inputKey[nested];
        if (nextSchema && typeof nextInput === 'object')
          this.validate(nextSchema, nextInput, results, errors);
      }
    }
  }

  /**
   * @description Return a list of all unique, non-overlapping elements from an array.
   */
  private findNonOverlappingElements(target: string[], truth: string[]) {
    const truthSet = new Set(truth);
    return target.filter((value: string) => !truthSet.has(value));
  }

  /**
   * @description Checks if all required keys are present in the input object and that they have a defined value.
   */
  private areRequiredKeysPresent(requiredKeys: string[], input: Record<string, any> = []) {
    if (requiredKeys.length === 0) return true;
    const inputKeys = new Set(Object.keys(input));
    return requiredKeys.every((key) => inputKeys.has(key) && this.isDefined(input[key]));
  }

  /**
   * @description Validates a single property and pushes any errors directly into the results array.
   */
  private pushValidationErrors<Schema extends Record<string, any>>(
    key: string,
    properties: SchemaDefinition<Schema>,
    value: ValidationValue,
    results: Result[]
  ) {
    if (!properties) {
      if (!this.isSilent)
        console.warn(`Missing property '${properties}' for match '${value}'. Skipping...`);
      results.push({ key, value, success: true, error: '' });
      return;
    }

    const props = properties as Record<string, any>;
    const type = props.type;
    const format = props.format;
    const minLength = props.minLength;
    const maxLength = props.maxLength;
    const minValue = props.minValue;
    const maxValue = props.maxValue;
    const matchesPattern = props.matchesPattern as RegExp | undefined;

    if (type && !checkType(type, value))
      results.push({ key, value, success: false, error: 'Invalid type' });

    if (format && !checkFormat(format, value as string))
      results.push({ key, value, success: false, error: 'Invalid format' });

    if (minLength && !isMinLen(minLength, value))
      results.push({ key, value, success: false, error: 'Length too short' });

    if (maxLength && !isMaxLen(maxLength, value))
      results.push({ key, value, success: false, error: 'Length too long' });

    if (minValue && !isMinVal(minValue, value as number))
      results.push({ key, value, success: false, error: 'Value too small' });

    if (maxValue && !isMaxVal(maxValue, value as number))
      results.push({ key, value, success: false, error: 'Value too large' });

    if (matchesPattern && !matchesPattern.test(value as string))
      results.push({ key, value, success: false, error: 'Pattern does not match' });
  }

  /**
   * @description Generates a functional validation schema from the provided input.
   *
   * @example
   * import { MikroValid } from 'mikrovalid';
   *
   * const mikrovalid = new MikroValid();
   *
   * const input = {
   *   personal: {
   *     name: 'Sam Person'
   *   },
   *   work: {
   *     office: 'London',
   *     currency: 'GBP',
   *     salary: 10000
   *   }
   * };
   *
   * mikrovalid.schemaFrom(input);
   */
  public schemaFrom(input: any): ValidationSchema {
    const schema: ValidationSchema = {
      properties: {
        additionalProperties: false,
        required: []
      }
    };

    const properties = schema.properties as Record<string, any>;

    for (const key in input) {
      const value = input[key];
      properties.required.push(key);

      if (Array.isArray(value)) properties[key] = this.generateArraySchema(value);
      else if (typeof value === 'object' && value !== null)
        properties[key] = this.generateNestedObjectSchema(value);
      else properties[key] = this.generatePropertySchema(value);
    }

    return schema;
  }

  private generateArraySchema(array: unknown[]): ValidationSchema {
    const schema: Record<string, any> = { type: 'array' };
    const cleanedArray = array.filter((element) => element);

    if (cleanedArray.length > 0) {
      const firstElement = cleanedArray[0];

      const allOfSameType = cleanedArray.every((element) => typeof element === typeof firstElement);

      if (allOfSameType) {
        if (typeof firstElement === 'object' && !Array.isArray(firstElement)) {
          schema.items = this.generateNestedObjectSchema(firstElement as Record<string, any>);
        } else {
          schema.items = this.generatePropertySchema(firstElement);
        }
      } else {
        console.warn(
          'All elements in array are not of the same type. Unable to generate a schema for these elements.'
        );
      }
    }

    return schema as ValidationSchema;
  }

  private generateNestedObjectSchema(input: Record<string, any>): ValidationSchema {
    const schema: Record<string, any> = {
      type: 'object',
      additionalProperties: false,
      required: []
    };

    for (const key in input) {
      const value = input[key];
      schema.required.push(key);
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        schema[key] = this.generateNestedObjectSchema(value);
      } else schema[key] = this.generatePropertySchema(value);
    }

    return schema as ValidationSchema;
  }

  private generatePropertySchema(value: unknown): PropertySchema {
    const type: string = typeof value;
    const schema: Record<string, any> = { type };

    switch (type) {
      case 'string':
        schema.minLength = 1;
        break;
    }

    return schema as PropertySchema;
  }
}
