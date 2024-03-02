# mikrovalid

**MikroValid is the minimalist, smart, and easy way to validate objects on both the client and server-side.**

![Build Status](https://github.com/mikaelvesavuori/mikrovalid/workflows/main/badge.svg)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mikaelvesavuori_mikrovalid&metric=alert_status)](https://sonarcloud.io/dashboard?id=mikaelvesavuori_mikrovalid)

[![codecov](https://codecov.io/gh/mikaelvesavuori/mikrovalid/graph/badge.svg?token=2P5YYO89J2)](https://codecov.io/gh/mikaelvesavuori/mikrovalid)

[![Maintainability](https://api.codeclimate.com/v1/badges/d42f8b255d893431050f/maintainability)](https://codeclimate.com/github/mikaelvesavuori/mikrovalid/maintainability)

---

MikroValid is the JSON validator that cuts out all the bullshit:

- Dead easy, no proprietary stuff — uses simple JSON objects for schemas and input
- Doesn't pollute your code with "convenient" APIs
- Minimalist approach that will work for the majority of conventional-type objects
- Meant to work effortlessly in both client- and server-side environments
- Tiny (~1.8 KB gzipped), which is ~7-80x smaller than common, popular options
- Zero dependencies
- Has 100% test coverage

## Usage

### Basic importing and usage

```typescript
// ES5 format
const { MikroValid } = require('mikrovalid');
// ES6 format
import { MikroValid } from 'mikrovalid';

const mikrovalid = new MikroValid();

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

const { success, errors } = mikrovalid.test(schema, input);

console.log('Was the test successful?', success);
```

### Errors

The `errors` object includes an aggregation of any errors, both those relating to field-level validation and for inline failures emitted when not having required keys or having excess keys.

Since version `1.0.3` both error formats have the same shape:

```json
[
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

`properties` is the only **required** root-level object. Each key describes a property of the expected input. In the example, `name` is of the type `string`. Note that you never repeat the `properties` keyword—it's used only in the root.

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
  "second": "the second",
  "third": "the third",
  "fourth": "the fourth"
}
```

...would therefore break the validation.

The same can be done with nested objects:

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

You can require basic validation of `array` items by setting the expected type in `items.type`:

```json
{
  "properties": {
    "books": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  }
}
```

For this schema, a valid input could for example be something like:

```json
{
  "books": [{ "author": "Cormac McCarthy" }, { "author": "William Blake" }]
}
```

Note that this will not work for mixed arrays or for any deeper inspection of object properties.

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

#### Matches regular expression pattern

You can provide your own regular expressions to match for.

```json
{
  "properties": {
    "runtime": {
      "matchesPattern": /^(nodejs20|python3.7)$/
    }
  }
}
```

## License

MIT. See `LICENSE` file.
