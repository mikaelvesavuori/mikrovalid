import test from 'ava';

import { MikroValid } from '../src/domain/MikroValid';

const match = new MikroValid();

/**
 * POSITIVE TESTS
 */
test('It should validate a string', (t) => {
  const expected = true;
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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

test('It should validate a nested object', (t) => {
  const expected = true;
  const { success } = match.test(
    {
      properties: {
        boxes: {
          type: 'object',
          box: {
            type: 'string'
          }
        }
      },
      required: ['boxes']
    },
    {
      boxes: { box: 'stuff' }
    }
  );

  t.is(success, expected);
});

/**
 * TYPES
 */

test('It should validate a string that has the correct type', (t) => {
  const expected = true;
  const { success } = match.test(
    {
      properties: {
        username: {
          type: 'string'
        }
      }
    },
    {
      username: 'SamPerson'
    }
  );

  t.is(success, expected);
});

test('It should invalidate a string that does not have the correct type', (t) => {
  const expected = false;
  const { success } = match.test(
    {
      properties: {
        username: {
          type: 'string'
        }
      }
    },
    {
      username: 1
    }
  );

  t.is(success, expected);
});

test('It should validate a number that has the correct type', (t) => {
  const expected = true;
  const { success } = match.test(
    {
      properties: {
        phone: {
          type: 'number'
        }
      }
    },
    {
      phone: 1
    }
  );

  t.is(success, expected);
});

test('It should invalidate a number that does not have the correct type', (t) => {
  const expected = false;
  const { success } = match.test(
    {
      properties: {
        phone: {
          type: 'number'
        }
      }
    },
    {
      phone: '1'
    }
  );

  t.is(success, expected);
});

test('It should validate a boolean that has the correct type', (t) => {
  const expected = true;
  const { success } = match.test(
    {
      properties: {
        isFabulous: {
          type: 'boolean'
        }
      }
    },
    {
      isFabulous: true
    }
  );

  t.is(success, expected);
});

test('It should invalidate a boolean that does not have the correct type', (t) => {
  const expected = false;
  const { success } = match.test(
    {
      properties: {
        isFabulous: {
          type: 'boolean'
        }
      }
    },
    {
      isFabulous: 'true'
    }
  );

  t.is(success, expected);
});

test('It should validate an object that has the correct type', (t) => {
  const expected = true;
  const { success } = match.test(
    {
      properties: {
        myStuff: {
          type: 'object'
        }
      }
    },
    {
      myStuff: {}
    }
  );

  t.is(success, expected);
});

test('It should invalidate an object that does not have the correct type', (t) => {
  const expected = false;
  const { success } = match.test(
    {
      properties: {
        myStuff: {
          type: 'object'
        }
      }
    },
    {
      myStuff: 4
    }
  );

  t.is(success, expected);
});

test('It should validate an array that has the correct type', (t) => {
  const expected = true;
  const { success } = match.test(
    {
      properties: {
        myStuff: {
          type: 'array'
        }
      }
    },
    {
      myStuff: [{ laptop: 'Macbook' }]
    }
  );

  t.is(success, expected);
});

test('It should invalidate an array that does not have the correct type', (t) => {
  const expected = false;
  const { success } = match.test(
    {
      properties: {
        myStuff: {
          type: 'array'
        }
      }
    },
    {
      myStuff: '[]'
    }
  );

  t.is(success, expected);
});

/**
 * FORMATS
 */

test('It should validate a string that has an alphanumeric format', (t) => {
  const expected = true;
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
  const { success } = match.test(
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
        }
      },
      additionalProperties: true
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
  const { success } = match.test(
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
        }
      },
      additionalProperties: false
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
  const { success } = match.test(
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
  const { success } = match.test(
    {
      properties: {
        component: {
          matchesPattern: /^(function|queue|storage|event)$/
        },
        memory: {
          type: 'number',
          minValue: 128,
          maxValue: 3008
        },
        architecture: {
          matchesPattern: /^(arm|x86)$/
        },
        runtime: {
          matchesPattern: /^(nodejs20|python3\.7)$/
        },
        code: {
          type: 'string'
        }
      },
      required: ['component', 'memory', 'architecture', 'runtime', 'code']
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

test('It should validate a App Component', (t) => {
  const expected = true;
  const { success } = match.test(
    {
      properties: {
        component: {
          matchesPattern: /^(list|button|text|image|dropdown)$/
        },
        name: {
          type: 'string',
          minLength: 3,
          maxLength: 50
        },
        imageSource: {
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
        }
      },
      required: ['component', 'name', 'imageSource', 'url', 'altText']
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
  const schema = {
    properties: {
      personal: {
        name: {
          type: 'string'
        },
        required: ['name']
      },
      work: {
        office: {
          type: 'string'
        },
        currency: {
          type: 'string'
        },
        salary: {
          type: 'number'
        },
        required: ['office']
      }
    },
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

  const { success } = match.test(schema, input);

  t.is(success, true);
});

/**
 * NEGATIVE TESTS
 */
test('It should fail when missing a required key in the base', (t) => {
  const expected = `Missing one or more of the required keys: 'thing'!`;
  const result = match.test(
    {
      properties: {
        thing: {
          type: 'string'
        }
      },
      required: ['thing']
    },
    {}
  );

  t.is(result.errors[0], expected);
});

test('It should fail when missing a required key in the root of a nested object', (t) => {
  const expected = `Missing one or more of the required keys: 'things'!`;
  const result = match.test(
    {
      properties: {
        things: {
          type: 'object',
          required: ['nestedThings'],
          nestedThings: {
            type: 'string'
          }
        }
      },
      required: ['things']
    },
    {
      dings: {}
    }
  );

  t.is(result.errors[0], expected);
});

test('It should fail when missing a required key in the child of a nested object', (t) => {
  const expected = `Missing one or more of the required keys: 'deeperThings'!`;
  const result = match.test(
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
              something: 'number'
            }
          }
        }
      },
      required: ['things']
    },
    {
      things: {
        nestedThings: {}
      }
    }
  );

  t.is(result.errors[0], expected);
});

test('It should throw an error if there is no input', (t) => {
  const expected = 'Error';
  const error: any = t.throws(() => {
    // @ts-ignore
    match.test({
      properties: {
        money: 'number'
      }
    });
  });

  t.is(error.name, expected);
});
