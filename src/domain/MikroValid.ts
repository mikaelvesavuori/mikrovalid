import {
  FirstLevelDefinition,
  PropertySchema,
  Result,
  RootDefinition,
  SchemaDefinition,
  ValidationError,
  ValidationFormat,
  ValidationResult,
  ValidationSchema,
  ValidationTypes,
  ValidationValue
} from '../interfaces/MikroValid.js';

export class MikroValid {
  /**
   * Toggle to silence (suppress) non-critical messages, such as warnings.
   */
  private readonly isSilent: boolean;

  constructor(isSilent = false) {
    this.isSilent = isSilent;
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

    const { results, errors } = this.validate(schema.properties, input);
    const aggregatedErrors = this.compileErrors(results, errors);
    const success = this.isSuccessful(results, aggregatedErrors);

    return {
      errors: aggregatedErrors,
      success
    };
  }

  /**
   * @description Aggregate errors into a flat array.
   */
  private compileErrors(results: Result[], errors: ValidationError[]): ValidationError[] {
    const resultErrors = results.filter((result: Result) => result.success === false);
    return [...errors, ...resultErrors].flatMap((error: Result) => error);
  }

  /**
   * @description Check if this was, ultimately, a successful and valid test run.
   */
  private isSuccessful(results: Result[], errors: ValidationError[]) {
    return (
      results.every((result: Record<string, any>) => result.success === true) && errors.length === 0
    );
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
    const isAdditionalsOk = schema?.additionalProperties ?? true;
    const requiredKeys: string[] = schema?.required || [];

    errors = this.checkForRequiredKeysErrors(requiredKeys, input, errors);
    errors = this.checkForDisallowedProperties(
      Object.keys(input),
      Object.keys(schema),
      errors,
      isAdditionalsOk
    );

    for (const key in schema) {
      const isKeyRequired = requiredKeys.includes(key) && key !== 'required';
      const propertyKey = schema[key];
      const inputKey: ValidationValue = input[key];
      const isInnerAdditionalsOk = propertyKey.additionalProperties ?? true;

      if (isKeyRequired)
        errors = this.checkForRequiredKeysErrors(
          propertyKey.required || [],
          inputKey as Record<string, any>,
          errors
        );

      if (this.isDefined(inputKey)) {
        this.handleValidation(key, inputKey, propertyKey, results);

        errors = this.checkForDisallowedProperties(
          Object.keys(inputKey),
          Object.keys(propertyKey),
          errors,
          isInnerAdditionalsOk
        );

        this.handleNestedObject(inputKey as Record<string, any>, propertyKey, results, errors);
      }
    }

    return { results, errors };
  }

  /**
   * @description Checks if a value is actually defined as a non-null value.
   */
  private isDefined(value: unknown) {
    if (!!value || value === '') return true;
    return false;
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
      errors.push({
        key: '',
        value: input,
        success: false,
        error: `Missing the required key: '${missingKeys.join(', ')}'!`
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
   * input is an object or not.
   */
  private handleValidation<Schema extends Record<string, any>>(
    key: string,
    inputKey: ValidationValue,
    propertyKey: SchemaDefinition<Schema>,
    results: Result[]
  ) {
    const validation = this.validateProperty(key, propertyKey, inputKey);
    results.push(validation);

    if (this.isArray(inputKey) && propertyKey.items != null) {
      // @ts-ignore - inputKey is an array
      inputKey.forEach((arrayItem: ValidationValue) => {
        const validation = this.validateProperty(key, propertyKey.items!, arrayItem);
        results.push(validation);
      });
    } else if (this.isObject(inputKey)) {
      const keys = Object.keys(inputKey);
      keys.forEach((innerKey: string) => {
        const validation = this.validateProperty(
          innerKey,
          propertyKey[innerKey],
          // @ts-ignore - innerKey will be an object
          inputKey[innerKey]
        );
        results.push(validation);
      });
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
    if (this.isObject(inputKey)) {
      const nestedObjects = this.getNestedObjects(inputKey);

      for (const nested of nestedObjects) {
        const nextSchema = propertyKey[nested];
        const nextInput = inputKey[nested];
        if (nextSchema && nextInput) this.validate(nextSchema, nextInput, results, errors);
      }
    }
  }

  /**
   * @description Get the name of all objects with nesting from a parent object.
   */
  private getNestedObjects(item: ValidationValue) {
    return Object.keys(item).filter((key: string) => {
      if (this.isObject(item as string)) return key;
    });
  }

  /**
   * @description Return a list of all unique, non-overlapping elements from an array.
   */
  private findNonOverlappingElements(target: string[], truth: string[]) {
    return target.filter((value: string) => !truth.includes(value));
  }

  /**
   * @description Checks if all required keys are present in the input object.
   */
  private areRequiredKeysPresent(requiredKeys: string[], input: Record<string, any> = []) {
    return requiredKeys.every((key) => Object.keys(input).includes(key));
  }

  /**
   * @description Controller for validation purposes. Returns back a more comprehensive validation object.
   */
  private validateProperty<Schema>(
    key: string,
    properties: SchemaDefinition<Schema>,
    value: ValidationValue
  ): Result {
    const { success, error } = this.validateInput(properties, value);
    return {
      key,
      value,
      success,
      error: error ?? ''
    };
  }

  /**
   * @description Performs field-level validation.
   */
  private validateInput<Schema extends Record<string, any>>(
    properties: SchemaDefinition<Schema>,
    match: ValidationValue
  ): ValidationResult {
    if (properties) {
      const checks = [
        {
          condition: () => properties['type'],
          validator: () => this.isCorrectType(properties['type']!, match),
          error: 'Invalid type'
        },
        {
          condition: () => properties['format'],
          validator: () => this.isCorrectFormat(properties['format']!, match as string),
          error: 'Invalid format'
        },
        {
          condition: () => properties['minLength'],
          validator: () => this.isMinimumLength(properties['minLength']!, match),
          error: 'Length too short'
        },
        {
          condition: () => properties['maxLength'],
          validator: () => this.isMaximumLength(properties['maxLength']!, match),
          error: 'Length too long'
        },
        {
          condition: () => properties['minValue'],
          validator: () => this.isMinimumValue(properties['minValue']!, match as number),
          error: 'Value too small'
        },
        {
          condition: () => properties['maxValue'],
          validator: () => this.isMaximumValue(properties['maxValue']!, match as number),
          error: 'Value too large'
        },
        {
          condition: () => properties['matchesPattern'],
          validator: () => this.matchesPattern(properties['matchesPattern']!, match as string),
          error: 'Pattern does not match'
        }
      ];

      for (const check of checks) {
        if (check.condition() && !check.validator()) {
          return { success: false, error: check.error };
        }
      }
    } else {
      if (!this.isSilent)
        console.warn(`Missing property '${properties}' for match '${match}'. Skipping...`);
    }

    return { success: true };
  }

  /**
   * @description Checks whether or not a type is correct.
   */
  private isCorrectType(expected: ValidationTypes, input: ValidationValue) {
    switch (expected) {
      case 'string':
        return typeof input === 'string';
      case 'number':
        return typeof input === 'number' && !isNaN(input);
      case 'boolean':
        return typeof input === 'boolean';
      case 'object':
        return this.isObject(input as string);
      case 'array':
        return this.isArray(input as string);
    }
  }

  /**
   * @description Checks if input is an object.
   */
  private isObject(input: any) {
    return (
      input !== null &&
      !this.isArray(input) &&
      typeof input === 'object' &&
      input instanceof Object &&
      Object.prototype.toString.call(input) === '[object Object]' // This will solve many validation cases, but will break Symbol support
    );
  }

  /**
   * @description Checks if input is an array.
   */
  private isArray(input: unknown) {
    return Array.isArray(input);
  }

  /**
   * @description Checks if the input string matches a particular format.
   *
   * Valid formats are:
   * - `alphanumeric`
   * - `date`
   * - `email`
   * - `hexColor`
   * - `numeric`
   * - `url`
   */
  private isCorrectFormat(expected: ValidationFormat, input: string) {
    switch (expected) {
      case 'alphanumeric': {
        return new RegExp(/^[a-zA-Z0-9]+$/).test(input);
      }
      case 'numeric': {
        return new RegExp(/^-?\d+(\.\d+)?$/).test(input);
      }
      case 'email': {
        return new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/).test(input);
      }
      case 'date': {
        return new RegExp(/^\d{4}-\d{2}-\d{2}$/).test(input);
      }
      case 'url': {
        return new RegExp(/^(https?):\/\/[^\s$.?#].[^\s]*$/).test(input);
      }
      case 'hexColor': {
        return new RegExp(/^#?([a-f0-9]{6}|[a-f0-9]{3})$/i).test(input);
      }
    }
  }

  /**
   * @description Checks if an input is of a minimum length. Works for both arrays and strings.
   */
  private isMinimumLength(minLength: number, input: ValidationValue) {
    if (Array.isArray(input)) return input.length >= minLength;
    return input.toString().length >= minLength;
  }

  /**
   * @description Checks if an input is of a maximum length. Works for both arrays and strings.
   */
  private isMaximumLength(maxLength: number, input: ValidationValue) {
    if (Array.isArray(input)) return input.length <= maxLength;
    return input.toString().length <= maxLength;
  }

  /**
   * @description Checks if an inpu is of a minimum numeric value.
   */
  private isMinimumValue(minValue: number, input: number) {
    return input >= minValue;
  }

  /**
   * @description Checks if an input is of a maximum numeric value.
   */
  private isMaximumValue(minValue: number, input: number) {
    return input <= minValue;
  }

  /**
   * @description Checks whether a string matches against a user-provided regular expression.
   */
  private matchesPattern(pattern: RegExp, input: string) {
    return new RegExp(pattern).test(input);
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
    const schema: ValidationSchema = { properties: {}, additionalProperties: false, required: [] };

    for (const key in input) {
      const value = input[key];
      schema.required!.push(key);

      if (Array.isArray(value)) {
        schema.properties![key] = this.generateArraySchema(value);
      } else if (typeof value === 'object' && value !== null) {
        schema.properties![key] = this.generateNestedObjectSchema(value);
      } else {
        schema.properties![key] = this.generatePropertySchema(value);
      }
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
