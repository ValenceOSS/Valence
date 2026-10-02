import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { ArrFields } from '@ValenceRequests/arrImport/schemas/ArrFieldsSchema';

/**
 * Reads the settings of a download client, indexer or custom format the way an app lists them, as
 * named fields, by name and in the shape each is wanted in.
 *
 * @param fields - The fields.
 * @returns How to read them.
 */
const fieldsOf = (fields: ArrFields) => {
  const valueOf = (name: string): JsonValue | undefined =>
    fields.find((field) => field.name === name)?.value;

  return {
    text: (name: string): string => {
      const value = valueOf(name);

      return typeof value === 'string'
        ? value.trim()
        : typeof value === 'number'
          ? value.toString()
          : '';
    },

    number: (name: string): number | null => {
      const value = valueOf(name);

      if (typeof value === 'number') {
        return value;
      }

      return typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim())
        ? Number(value)
        : null;
    },

    flag: (name: string): boolean => valueOf(name) === true,

    numbers: (name: string): number[] => {
      const value = valueOf(name);

      return Array.isArray(value)
        ? value.filter((each): each is number => typeof each === 'number')
        : [];
    },
  };
};

export { fieldsOf };
