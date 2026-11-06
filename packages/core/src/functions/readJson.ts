import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

/**
 * Reads JSON without throwing, as nothing where it is not JSON.
 *
 * @param text - What might be JSON.
 * @returns What it says, or nothing.
 */
const readJson = (text: string): JsonValue | null => {
  try {
    const read = JsonValueSchema.safeParse(JSON.parse(text));

    return read.success ? read.data : null;
  } catch {
    return null;
  }
};

export { readJson };
