import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Schema<Value> = {
  safeParse: (body: JsonValue) => { success: true; data: Value } | { success: false };
};

/**
 * Reads a request's JSON body through a schema, or nothing where it was not JSON or not the shape
 * asked for.
 *
 * @param request - The request.
 * @param schema - The shape it must be in.
 * @returns What it said, or null.
 */
const readBody = async <Value>(request: Request, schema: Schema<Value>): Promise<Value | null> => {
  try {
    const read = schema.safeParse(JsonValueSchema.parse(await request.json()));

    return read.success ? read.data : null;
  } catch {
    return null;
  }
};

export { readBody };
