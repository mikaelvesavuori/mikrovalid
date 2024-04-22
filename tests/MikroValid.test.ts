import test from 'ava';

import { MikroValid } from '../src/domain/MikroValid';

const mikrovalid = new MikroValid(true);

/**
 * POSITIVE TESTS
 */
test('It should set silent mode', (t) => {
  let warnCalled = false;
  const originalWarn = console.warn;

  console.warn = () => (warnCalled = true);

  new MikroValid(true).test(
    {
      properties: {
        inside: {
          type: 'object',
          thing: {
            type: 'string'
          },
          additionalProperties: false
        }
      }
    },
    {
      inside: {
        somethingElse: '...?'
      }
    }
  );

  t.false(warnCalled, 'console.warn was called when it should not have been');

  t.teardown(() => (console.warn = originalWarn));
});

test('It should emit warning messages', (t) => {
  let warnCalled = true;
  const originalWarn = console.warn;

  console.warn = () => (warnCalled = false);

  new MikroValid(false).test(
    {
      properties: {
        inside: {
          type: 'object',
          thing: {
            type: 'string'
          },
          additionalProperties: false
        }
      }
    },
    {
      inside: {
        somethingElse: '...?'
      }
    }
  );

  t.false(warnCalled, 'console.warn was not called when it should have been');

  t.teardown(() => (console.warn = originalWarn));
});

test('It should validate a string', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        username: {
          type: 'string'
        }
      }
    },
    {
      username: 'Sam Person'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that is too long', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        username: {
          type: 'string',
          maxLength: 2
        }
      }
    },
    {
      username: 'SamPerson'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that is too short', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        username: {
          type: 'string',
          minLength: 20
        }
      }
    },
    {
      username: 'SamPerson'
    }
  );

  t.is(success, expected);
});

test('It should validate a number', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        phone: {
          type: 'number'
        }
      }
    },
    {
      phone: 7012312300
    }
  );

  t.is(success, expected);
});

test('It should validate a number that is too small', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        phone: {
          type: 'number',
          minValue: 1000
        }
      }
    },
    {
      phone: 999
    }
  );

  t.is(success, expected);
});

test('It should validate a number that is too big', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        phone: {
          type: 'number',
          maxValue: 10
        }
      }
    },
    {
      phone: 999
    }
  );

  t.is(success, expected);
});

test('It should validate an array', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        fruits: {
          type: 'array'
        }
      }
    },
    {
      fruits: ['banana', 'apple', 'orange']
    }
  );

  t.is(success, expected);
});

test('It should validate an array containing numbers', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        payments: {
          type: 'array',
          items: {
            type: 'number'
          }
        }
      }
    },
    {
      payments: [1000, 700, 540]
    }
  );

  t.is(success, expected);
});

test('It should validate an array containing objects', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        books: {
          type: 'array',
          items: {
            type: 'object'
          }
        }
      }
    },
    {
      books: [{ author: 'Cormac McCarthy' }, { author: 'William Blake' }]
    }
  );

  t.is(success, expected);
});

test('It should invalidate an array that should only contain numbers', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        payments: {
          type: 'array',
          items: {
            type: 'number'
          }
        }
      }
    },
    {
      payments: ['1000', 700, 540]
    }
  );

  t.is(success, expected);
});

test('It should invalidate an array that is too long', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        fruits: {
          type: 'array',
          maxLength: 2
        }
      }
    },
    {
      fruits: ['banana', 'apple', 'orange']
    }
  );

  t.is(success, expected);
});

test('It should invalidate an array that is too short', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        fruits: {
          type: 'array',
          minLength: 4
        }
      }
    },
    {
      fruits: ['banana', 'apple', 'orange']
    }
  );

  t.is(success, expected);
});

test('It should validate an object', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        boxes: {
          type: 'object'
        }
      }
    },
    {
      boxes: {}
    }
  );

  t.is(success, expected);
});

test('It should not validate an empty string when using matchesPattern', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        thing: {
          type: 'string',
          matchesPattern: /^(something)$/
        }
      }
    },
    {
      thing: ''
    }
  );

  t.is(success, expected);
});

test('It should validate a nested object', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        boxes: {
          type: 'object',
          box: {
            type: 'string'
          }
        },
        required: ['boxes']
      }
    },
    {
      boxes: { box: 'stuff' }
    }
  );

  t.is(success, expected);
});

test('It should skip checking for required properties nested in non-existing optional properties', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        id: { type: 'string' },
        contextId: { type: 'string' },
        coordinates: {
          x: { type: 'number' },
          y: { type: 'number' },
          type: 'object',
          required: ['x', 'y']
        },
        required: ['id', 'contextId']
      }
    },
    {
      id: 'some_id',
      contextId: 'some_id'
    }
  );

  t.is(success, expected);
});

test('It should validate an input that only uses required (not optional) properties', (t) => {
  const expected = true;

  const schema: any = {
    properties: {
      url: {
        type: 'string'
      },
      requestMethod: {
        type: 'string',
        matchesPattern: /^(GET|POST|PUT|PATCH|DELETE)$/
      },
      authentication: {
        type: 'object',
        authType: {
          type: 'string',
          matchesPattern: /^(header|queryparam|oauth)$/
        },
        additionalProperties: false
      },
      headers: {
        type: 'object'
      },
      queryParams: {
        type: 'object'
      },
      required: ['url', 'requestMethod'],
      additionalProperties: false
    }
  };

  const input = {
    url: 'https://ajwh82hd.asdf.xyz',
    requestMethod: 'POST'
  };

  const { success } = mikrovalid.test(schema, input);

  t.is(success, expected);
});

test('It should invalidate a partial failure (invalid optional property)', (t) => {
  const expected = false;

  const schema: any = {
    properties: {
      url: {
        type: 'string'
      },
      requestMethod: {
        type: 'string',
        matchesPattern: /^(GET|POST|PUT|PATCH|DELETE)$/
      },
      queryParams: {
        type: 'object'
      },
      required: ['url'],
      additionalProperties: false
    }
  };

  const input = {
    url: 'https://ajwh82hd.asdf.xyz',
    requestMethod: 'POST',
    queryParams: 'not an object'
  };

  const { success } = mikrovalid.test(schema, input);

  t.is(success, expected);
});

test('It should invalidate multiple errors separately', (t) => {
  const expected = [
    {
      key: '',
      value: { first: 1, third: 3 },
      success: false,
      error: "Missing the required key: 'second'!"
    },
    { key: 'first', value: 1, success: false, error: 'Invalid type' },
    { key: 'third', value: 3, success: false, error: 'Invalid type' }
  ];

  const { errors } = mikrovalid.test(
    {
      properties: {
        box: {
          type: 'object',
          first: {
            type: 'string'
          },
          second: {
            type: 'string'
          },
          third: {
            type: 'string'
          },
          required: ['first', 'second', 'third']
        },
        required: ['box']
      }
    },
    { box: { first: 1, third: 3 } }
  );

  t.deepEqual(errors, expected);
});

/**
 * TYPES
 */

const toMacro = (type: 'string' | 'number' | 'boolean' | 'object' | 'array') =>
  test.macro({
    exec(t, input, expected: boolean) {
      const { success } = mikrovalid.test(
        {
          properties: {
            property: {
              type: type // Just making this totally explicit
            }
          }
        },
        {
          property: input
        }
      );
      t.is(success, expected);
    },
    title(providedTitle = '', input, expected) {
      return `${providedTitle} [${input} = ${expected}]`.trim();
    }
  });

const stringMacro = toMacro('string');

[
  '',
  'string',
  String('boxed'),
  `template`,
  '😄',
  '\uD801\uDC00',
  String.raw`C:\Folder\folder\file.html`
].forEach((input) =>
  test('It should validate a string that has the correct type', stringMacro, input, true)
);

[
  -1,
  1,
  new Date(),
  Infinity,
  new Set(),
  new Map(),
  () => { },
  { [Symbol.toStringTag]: 'Empty Object' },
  { [Symbol.toStringTag]: 'Object with value', property: 'value' }
].forEach((input) => {
  test(
    'It should invalidate a string that does not have the correct type',
    stringMacro,
    input,
    false
  );
});

const numberMacro = toMacro('number');

[
  -1,
  1,
  Infinity,
  -Infinity,
  0.1,
  2.0,
  Number.MAX_SAFE_INTEGER,
  Number.MAX_VALUE,
  Number.MIN_VALUE,
  Number(3)
].forEach((input) => {
  test('It should validate a number that has the correct type ', numberMacro, input, true);
});

[
  'string',
  new Date(),
  new Set(),
  new Map(),
  () => { },
  { [Symbol.toStringTag]: 'Empty Object' },
  { [Symbol.toStringTag]: 'Object with value', property: 'value' }
].forEach((input) => {
  test(
    'It should invalidate a number that does not have the correct type',
    numberMacro,
    input,
    false
  );
});

const booleanMacro = toMacro('boolean');

[true, false].forEach((input) => {
  test('It should validate a boolean that has the correct type', booleanMacro, input, true);
});

[
  `"false"`,
  { [Symbol.toStringTag]: 'Empty Object' },
  { [Symbol.toStringTag]: 'Object with value', property: 'value' }
].forEach((input) => {
  test(
    'It should invalidate a boolean that does not have the correct type',
    numberMacro,
    input,
    false
  );
});

const objectMacro = toMacro('object');

[{ something: 'Object with value', property: 'value' }].forEach((input) => {
  test('It should validate an object that has the correct type', objectMacro, input, true);
});

['string', Infinity, new Date(), new Map(), new Set(), [], function noop() { }].forEach(
  (input, i) => {
    test(
      `${i} - It should invalidate an object that does not have the correct type`,
      objectMacro,
      input,
      false
    );
  }
);

const arrayMacro = toMacro('array');

[[{ property: 'value' }], [], [''], Array({ length: undefined })].forEach((input, i) => {
  test(`${i} - It should validate an array that has the correct type`, arrayMacro, input, true);
});

['[]', {}, { length: 1 }, [].keys(), new Set(), new Map()].forEach((input, i) => {
  test(
    `${i} - It should invalidate an array that does not have the correct type`,
    arrayMacro,
    input,
    false
  );
});

/**
 * FORMATS
 */

test('It should validate a string that has an alphanumeric format', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        username: {
          type: 'string',
          format: 'alphanumeric'
        }
      }
    },
    {
      username: 'SamPerson'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that does not have an alphanumeric format', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        username: {
          type: 'string',
          format: 'alphanumeric'
        }
      }
    },
    {
      username: 'aslkjd92 10820918'
    }
  );

  t.is(success, expected);
});

test('It should validate a string that has a numeric format', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        phone: {
          type: 'string',
          format: 'numeric'
        }
      }
    },
    {
      phone: '123'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that does not have a numeric format', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        phone: {
          type: 'string',
          format: 'numeric'
        }
      }
    },
    {
      phone: '123x'
    }
  );

  t.is(success, expected);
});

test('It should validate a string that has an email format', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        email: {
          type: 'string',
          format: 'email'
        }
      }
    },
    {
      email: 'asdf@asdf.xyz'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that does not have an email format', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        email: {
          type: 'string',
          format: 'email'
        }
      }
    },
    {
      email: 'asdf@'
    }
  );

  t.is(success, expected);
});

test('It should validate a string that has a date format', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        date: {
          type: 'string',
          format: 'date'
        }
      }
    },
    {
      date: '2024-01-01'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that does not have a date format', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        date: {
          type: 'string',
          format: 'date'
        }
      }
    },
    {
      date: '20240101'
    }
  );

  t.is(success, expected);
});

test('It should validate a string that has a URL format', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        website: {
          type: 'string',
          format: 'url'
        }
      }
    },
    {
      website: 'https://asdf.xyz'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that does not have a URL format', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        website: {
          type: 'string',
          format: 'url'
        }
      }
    },
    {
      website: 'asdf.xyz'
    }
  );

  t.is(success, expected);
});

test('It should validate a string that has a hex color format', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        hex: {
          type: 'string',
          format: 'hexColor'
        }
      }
    },
    {
      hex: '#ff00ff'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that does not have a hex color format', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        hex: {
          type: 'string',
          format: 'hexColor'
        }
      }
    },
    {
      hex: '255, 255, 255'
    }
  );

  t.is(success, expected);
});

test('It should validate an input with additional properties that are allowed', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        first: {
          type: 'string'
        },
        second: {
          type: 'string'
        },
        third: {
          type: 'string'
        },
        additionalProperties: true
      }
    },
    {
      first: 'the first',
      second: 'the first',
      third: 'the third',
      fourth: 'the fourth'
    }
  );

  t.is(success, expected);
});

test('It should invalidate an input with additional properties that are disallowed', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        first: {
          type: 'string'
        },
        second: {
          type: 'string'
        },
        third: {
          type: 'string'
        },
        additionalProperties: false
      }
    },
    {
      first: 'the first',
      second: 'the first',
      third: 'the third',
      fourth: 'the fourth'
    }
  );

  t.is(success, expected);
});

test('It should invalidate an input with additional properties that are disallowed in a nested object', (t) => {
  const expected = false;
  const { success } = mikrovalid.test(
    {
      properties: {
        blip: {
          type: 'string'
        },
        inside: {
          type: 'object',
          thing: {
            type: 'string'
          },
          additionalProperties: false
        }
      }
    },
    {
      blip: 123,
      inside: {
        thing: 'scary monster',
        somethingElse: '...?'
      }
    }
  );

  t.is(success, expected);
});

/**
 * COMPONENTS AND MORE COMPLEX OBJECTS
 */

test('It should validate a Flow Component', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        component: {
          type: 'string',
          matchesPattern: /^(function|queue|storage|event)$/
        },
        memory: {
          type: 'number',
          minValue: 128,
          maxValue: 3008
        },
        architecture: {
          type: 'string',
          matchesPattern: /^(arm|x86)$/
        },
        runtime: {
          type: 'string',
          matchesPattern: /^(nodejs20|python3\.7)$/
        },
        code: {
          type: 'string'
        },
        required: ['component', 'memory', 'architecture', 'runtime', 'code']
      }
    },
    {
      component: 'function',
      memory: 512,
      architecture: 'arm',
      runtime: 'nodejs20',
      code: "export async function handler(event, context) { return { statusCode: 200, body: JSON.stringify('Hello world!') } }"
    }
  );

  t.is(success, expected);
});

test('It should validate an App Component', (t) => {
  const expected = true;
  const { success } = mikrovalid.test(
    {
      properties: {
        component: {
          type: 'string',
          matchesPattern: /^(list|button|text|image|dropdown)$/
        },
        name: {
          type: 'string',
          minLength: 3,
          maxLength: 50
        },
        imageSource: {
          type: 'string',
          matchesPattern: /^(online|local)$/
        },
        url: {
          type: 'string',
          minLength: 5,
          maxLength: 120
        },
        altText: {
          type: 'string',
          minLength: 1,
          maxLength: 200
        },
        required: ['component', 'name', 'imageSource', 'url', 'altText']
      }
    },
    {
      component: 'image',
      name: 'My image',
      imageSource: 'online',
      url: 'https://something.online.com/alkfjo3iu3.jpg',
      altText: 'A picture of something'
    }
  );

  t.is(success, expected);
});

test('It should work with the demo example', (t) => {
  const { success } = mikrovalid.test(
    {
      properties: {
        personal: {
          type: 'object',
          name: { type: 'string' },
          required: ['name']
        },
        work: {
          type: 'object',
          office: { type: 'string' },
          currency: { type: 'string' },
          salary: { type: 'number' },
          required: ['office']
        },
        required: ['personal', 'work']
      }
    },
    {
      personal: {
        name: 'Sam Person'
      },
      work: {
        office: 'London',
        currency: 'GBP',
        salary: 10000
      }
    }
  );

  t.is(success, true);
});

test('It should create a validation schema from the demo example', (t) => {
  const expected = {
    properties: {
      personal: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        name: { type: 'string', minLength: 1 }
      },
      work: {
        type: 'object',
        additionalProperties: false,
        required: ['office', 'currency', 'salary'],
        office: { type: 'string', minLength: 1 },
        currency: { type: 'string', minLength: 1 },
        salary: { type: 'number' }
      }
    },
    additionalProperties: false,
    required: ['personal', 'work']
  };

  const input = {
    personal: {
      name: 'Sam Person'
    },
    work: {
      office: 'London',
      currency: 'GBP',
      salary: 10000
    }
  };

  const validationSchema = mikrovalid.schemaFrom(input);
  const { success } = mikrovalid.test(validationSchema as any, input);

  t.deepEqual(validationSchema, expected);
  t.is(success, true);
});

test('It should create a validation schema from a simple JSON object input which does not pass due to null input values', (t) => {
  const expected: Record<string, any> = {
    properties: {
      time: { type: 'string', minLength: 1 },
      cancelled: { type: 'boolean' },
      fruits: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 1
        }
      }
    },
    additionalProperties: false,
    required: ['time', 'cancelled', 'fruits']
  };

  const input = {
    time: '20240301',
    cancelled: true,
    fruits: [null, 'orange']
  };

  const validationSchema = mikrovalid.schemaFrom(input);
  const { success } = mikrovalid.test(validationSchema as any, input);

  t.deepEqual(validationSchema, expected);
  t.is(success, false);
});

test('It should create a validation schema from a complex JSON object input which passes', (t) => {
  const expected: Record<string, any> = {
    properties: {
      identity: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'age', 'address'],
        name: { type: 'string', minLength: 1 },
        age: { type: 'number' },
        address: {
          type: 'object',
          additionalProperties: false,
          street: {
            type: 'string',
            minLength: 1
          },
          number: {
            type: 'number'
          },
          required: ['street', 'number']
        }
      },
      time: { type: 'string', minLength: 1 },
      cancelled: { type: 'boolean' },
      fruits: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          name: { type: 'string', minLength: 1 }
        }
      }
    },
    additionalProperties: false,
    required: ['identity', 'time', 'cancelled', 'fruits']
  };

  const input = {
    identity: { name: 'Some text here', age: 123, address: { street: 'Main Street', number: 123 } },
    time: '20240301',
    cancelled: true,
    fruits: [{ name: 'orange' }, { name: 'banana' }]
  };

  const validationSchema = mikrovalid.schemaFrom(input);
  const { success } = mikrovalid.test(validationSchema as any, input);

  t.deepEqual(validationSchema, expected);
  t.is(success, true);
});

test('It should not create array item data when arrays contain mixed types', (t) => {
  const expected: Record<string, any> = {
    properties: {
      fruits: { type: 'array' }
    },
    additionalProperties: false,
    required: ['fruits']
  };

  const input = {
    fruits: ['banana', 'orange', ['apple', 'pear']]
  };

  const validationSchema = mikrovalid.schemaFrom(input);
  const { success } = mikrovalid.test(validationSchema as any, input);

  t.deepEqual(validationSchema, expected);
  t.is(success, true);
});

/**
 * NEGATIVE TESTS
 */
test('It should fail when missing a required key in the base', (t) => {
  const expected = {
    error: "Missing the required key: 'thing'!",
    key: '',
    success: false,
    value: {
      something: 123
    }
  };

  const result = mikrovalid.test(
    {
      properties: {
        thing: {
          type: 'string'
        },
        required: ['thing']
      }
    },
    { something: 123 }
  );

  t.deepEqual(result.errors[0], expected);
});

test('It should fail when missing a required key in the root of a nested object', (t) => {
  const expected = {
    error: "Missing the required key: 'things'!",
    key: '',
    success: false,
    value: {
      dings: {}
    }
  };

  const result = mikrovalid.test(
    {
      properties: {
        things: {
          type: 'object',
          required: ['nestedThings'],
          nestedThings: {
            type: 'string'
          }
        },
        required: ['things']
      }
    },
    {
      dings: {}
    }
  );

  t.deepEqual(result.errors[0], expected);
});

test('It should fail when missing a required key in the child of a nested object', (t) => {
  const expected = {
    error: "Missing the required key: 'deeperThings'!",
    key: '',
    success: false,
    value: {}
  };

  const result = mikrovalid.test(
    {
      properties: {
        things: {
          type: 'object',
          required: ['nestedThings'],
          nestedThings: {
            type: 'object',
            required: ['deeperThings'],
            deeperThings: {
              type: 'object',
              required: ['something'],
              something: { type: 'number' }
            }
          }
        },
        required: ['things']
      }
    },
    {
      things: {
        nestedThings: {}
      }
    }
  );

  t.deepEqual(result.errors[0], expected);
});

test('It should throw an error if there is no input', (t) => {
  const expected = 'Error';
  const error: any = t.throws(() => {
    mikrovalid.test(
      {
        properties: {
          money: { type: 'number' }
        }
      },
      undefined as any
    );
  });

  t.is(error.name, expected);
});
