import { z } from 'zod';

/**
 * A field read as nothing where its value cannot be read, rather than failing the whole answer: a
 * newer server can name a kind of client this app has never heard of, and a device list is still
 * worth showing without it. Done before the value is read rather than by catching the failure
 * after, so the API's description can still say what the field holds.
 *
 * @param schema - What the field holds when it can be read.
 * @returns The field, nothing where it cannot be read.
 */
const nullWhereUnreadable = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess((value) => (schema.safeParse(value).success ? value : null), schema.nullable());

export { nullWhereUnreadable };
