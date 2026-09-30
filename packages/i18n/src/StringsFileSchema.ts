import { z } from 'zod';

const StringEntrySchema = z.strictObject({
  handler: z.string().regex(/^[a-z][a-zA-Z0-9]*(?:\.[a-z0-9][a-zA-Z0-9]*)+$/u),
  text: z.string().min(1),
  context: z.string().min(1),
});

const StringsFileSchema = z.array(StringEntrySchema);

type StringEntry = z.infer<typeof StringEntrySchema>;

export { StringsFileSchema };
export type { StringEntry };
