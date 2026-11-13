import { z } from 'zod';

const StringsSchema = z.record(z.string(), z.string());

type Strings = z.infer<typeof StringsSchema>;

export { StringsSchema };
export type { Strings };
