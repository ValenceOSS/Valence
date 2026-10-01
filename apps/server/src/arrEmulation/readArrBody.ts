import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

/**
 * Reads what Overseerr or Jellyseerr sent, held to the shape expected of it.
 *
 * @param request - The request.
 * @param schema - The shape the body must be in.
 * @returns The body, or nothing where it was not JSON or not that shape.
 */
const readArrBody = async <Value>(
  request: Request,
  schema: { parse: (body: JsonValue) => Value },
): Promise<Value | null> => {
  try {
    return schema.parse(JsonValueSchema.parse(await request.json()));
  } catch {
    return null;
  }
};

export { readArrBody };
