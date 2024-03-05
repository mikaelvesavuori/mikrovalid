import {
  Result,
  ValidationError,
  ValidationProperties,
  ValidationResult,
  ValidationSchema,
  ValidationValue
} from '../interfaces/MikroValid';

export class MikroValid {
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
  public test(schema: ValidationSchema, input: Record<string, any>) {
    if (!input) throw new Error('Missing input!');

    const { results, errors } = this.validate(schema, input);
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
  private validate(
    schema: ValidationSchema,
    input: Record<string, any>,
    results: Result[] = [],
    errors: ValidationError[] = []
  ) {
    const properties = schema.properties || schema;
    const isAdditionalsOk = schema.additionalProperties ?? true;

    errors = this.checkForRequiredKeysErrors(schema.required || [], input, errors);
    errors = this.checkForDisallowedProperties(
      Object.keys(input),
      Object.keys(properties),
      errors,
      isAdditionalsOk
    );

    for (const key in properties) {
      const propertyKey = properties[key] as Record<string, any>;
      const inputKey: ValidationValue = input[key];
      const isAdditionalsOk = propertyKey.additionalProperties ?? true;

      errors = this.checkForRequiredKeysErrors(
        propertyKey.required || [],
        inputKey as Record<string, any>,
        errors
      );

      this.handleValidation(key, inputKey, propertyKey, results);

      if (this.isDefined(inputKey)) {
        errors = this.checkForDisallowedProperties(
          Object.keys(inputKey),
          Object.keys(propertyKey),
          errors,
          isAdditionalsOk
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
    if (!!value) return true;
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
          error: `Has additional disallowed properties: '${additionals.join(', ')}'!`
        });
    }

    return errors;
  }

  /**
   * @description Runs validation in the right way, based on whether the
   * input is an object or not.
   */
  private handleValidation(
    key: string,
    inputKey: ValidationValue,
    propertyKey: Record<string, any>,
    results: Result[]
  ) {
    const validation = this.validateProperty(key, propertyKey, inputKey);
    results.push(validation);

    if (this.isArray(inputKey)) {
      // @ts-ignore - inputKey is an array
      inputKey.forEach((arrayItem: ValidationValue) => {
        const validation = this.validateProperty(key, propertyKey['items'] || [], arrayItem);
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
  private validateProperty(
    key: string,
    properties: ValidationProperties,
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
  private validateInput(
    properties: ValidationProperties,
    match: ValidationValue
  ): ValidationResult {
    if (properties) {
      const checks = [
        {
          condition: () => properties['type'],
          validator: () => this.isCorrectType(properties['type'] as string, match),
          error: 'Invalid type'
        },
        {
          condition: () => properties['format'],
          validator: () => this.isCorrectFormat(properties['format'] as string, match as string),
          error: 'Invalid format'
        },
        {
          condition: () => properties['minLength'],
          validator: () => this.isMinimumLength(properties['minLength'] as number, match),
          error: 'Length too short'
        },
        {
          condition: () => properties['maxLength'],
          validator: () => this.isMaximumLength(properties['maxLength'] as number, match),
          error: 'Length too long'
        },
        {
          condition: () => properties['minValue'],
          validator: () => this.isMinimumValue(properties['minValue'] as number, match as number),
          error: 'Value too small'
        },
        {
          condition: () => properties['maxValue'],
          validator: () => this.isMaximumValue(properties['maxValue'] as number, match as number),
          error: 'Value too large'
        },
        {
          condition: () => properties['matchesPattern'],
          validator: () =>
            this.matchesPattern(properties['matchesPattern'] as string, match as string),
          error: 'Pattern does not match'
        }
      ];

      for (const check of checks) {
        if (check.condition() && !check.validator()) {
          return { success: false, error: check.error };
        }
      }
    } else {
      console.warn(`Missing property '${properties}' for match '${match}'. Skipping...`);
    }

    return { success: true };
  }

  /**
   * @description Checks whether or not a type is correct.
   */
  private isCorrectType(expected: string, input: ValidationValue) {
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
  private isCorrectFormat(expected: string, input: string) {
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
  private matchesPattern(pattern: string, input: string) {
    return new RegExp(pattern).test(input);
  }
}
