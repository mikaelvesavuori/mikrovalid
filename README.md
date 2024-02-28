# mikromatch

**MikroMatch is the minimalist, smart, and easy way to validate objects on both the client or server-side.**.

![Build Status](https://github.com/mikaelvesavuori/mikromatch/workflows/main/badge.svg)

---

MikroMatch is the JSON validator that cuts out all the bullshit:

- Dead easy, no proprietary stuff - uses simple JSON objects for schemas and input
- Doesn't pollute your code with "convenient" APIs
- Minimalist approach that will work for the majority of conventional-type objects
- Meant to work effortlessly in both client- and server-side environments
- Tiny (~5 KB gzipped), which is ~10-30x smaller than the common, popular options
- Zero dependencies
- Has 100% test coverage

## Usage

### Basic importing and usage

```typescript
// ES5 format
const { MikroMatch } = require('mikromatch');
// ES6 format
import { MikroMatch } from 'mikromatch';

const mikromatch = new MikroMatch();

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

const { success, errors } = mikromatch.test(schema, input);

console.log('Was the test successul?', success);
```

### Errors

The `errors` object includes an aggregation of any errors, both those relating to field-level validation and for inline failures emitted when not having required keys or having excess keys.

An example with both types of errors could look like:

```json
[
  "Has additional disallowed properties: 'somethingElse'!",
  { "key": "blip", "value": 123, "success": false, "error": "Invalid type" }
]
```

### Using schemas

The format is inspired by (but is not the same as, nor compliant with) [JSON Schema](https://json-schema.org).

The general shape it uses is:

```json
{
  "properties": {
    "username": {
      "type": "string"
    }
  },
  "required": ["name"]
}
```

A valid input for this particular schema is:

```json
{
  "username": "Sam Person"
}
```

#### Properties

`properties` is the only **required** root-level object. Each key describes a property of the expected input. In the example, `name` is of the type `string`. Note that you never repeat the `properties` keyword other than the first time, in the root.

#### Allowing or disallowing additional properties

By default, unknown properties will be allowed and valid. Setting `additionalProperties` to `false` enables you to disallow any unlisted properties.

```json
{
  "properties": {
    "first": {
      "type": "string"
    },
    "second": {
      "type": "string"
    },
    "third": {
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

A payload like this...

```json
{
  "first": "the first",
  "second": "the first",
  "third": "the third",
  "fourth": "the fourth"
}
```

...would therefore break the validation.

The same can be done for nested objects:

```json
{
  "properties": {
    "blip": {
      "type": "string"
    },
    "inside": {
      "type": "object",
      "thing": {
        "type": "string"
      },
      "additionalProperties": false
    }
  }
}
```

So this would not work:

```json
{
  "blip": "beep bloop",
  "inside": {
    "thing": "scary monster",
    "somethingElse": "...?"
  }
}
```

#### Required

For each level of nesting, including within objects, a `required` key with an array of strings _may_ be used to describe properties that must exist at that location.

#### Types

The `type` is the only **required** item-level object. Allowed types are:

- `string`
- `number`
- `boolean`
- `object`
- `array`

Note that there is no further validation of array objects (i.e. their contents) other than ensures they are an array (and if you like, of a certain length).

#### Formats

You can use a number of special keywords to specify expectations on the input. These are:

- `alphanumeric`
- `date` (YYYY-MM-DD)
- `email`
- `hexColor`
- `numeric`
- `url`

Usage is as simple as:

```json
{
  "properties": {
    "username": {
      "type": "string",
      "format": "email"
    }
  }
}
```

#### Deeply nested objects

This example shows 3 levels of nesting with objects.

```json
{
  "properties": {
    "things": {
      "type": "object",
      "required": ["nestedThings"],
      "nestedThings": {
        "type": "object",
        "required": ["deeperThings"],
        "deeperThings": {
          "type": "object",
          "required": ["something"],
          "something": "number"
        }
      }
    }
  },
  "required": ["things"]
}
```

#### Minimum length

```json
{
  "properties": {
    "username": {
      "type": "string",
      "minLength": 20
    }
  }
}
```

#### Maximum length

```json
{
  "properties": {
    "username": {
      "type": "string",
      "maxLength": 2
    }
  }
}
```

#### Minimum value

```json
{
  "properties": {
    "phone": {
      "type": "number",
      "minValue": 1000
    }
  }
}
```

#### Maximum value

```json
{
  "properties": {
    "phone": {
      "type": "number",
      "minValue": 1000
    }
  }
}
```

## Future ideas

- Add support for checking values of array items

## License

MIT. See `LICENSE` file.
