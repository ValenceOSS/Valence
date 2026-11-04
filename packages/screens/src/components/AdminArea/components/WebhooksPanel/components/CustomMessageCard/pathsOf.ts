import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

/**
 * Every path to a single value under some data, with an example, for the placeholder menu.
 *
 * @param value - The data.
 * @param prefix - The path so far.
 * @returns Each path and its value written as JSON.
 */
const pathsOf = (value: JsonValue, prefix: string): { path: string; example: string }[] =>
  value === null || typeof value !== 'object' || Array.isArray(value)
    ? [{ path: prefix, example: JSON.stringify(value) }]
    : Object.entries(value).flatMap(([key, inner]) => pathsOf(inner, `${prefix}.${key}`));

export { pathsOf };
