import type { JsonNode } from '@ValenceRequests/cardigann/JsonNode';

/**
 * Whether a JSON value is a list, which `Array.isArray` cannot say of a read-only one.
 *
 * @param value - The value.
 * @returns Whether it is a list.
 */
const isJsonList = (value: JsonNode | undefined): value is readonly JsonNode[] =>
  Array.isArray(value);

export { isJsonList };
