import { z } from 'zod';

type Said = {
  code: string | null;
  message: string;
  values: SaidValues;
};

type SaidValues = { [name: string]: string | number | Said };

const SaidSchema: z.ZodType<Said, Said> = z
  .object({
    code: z.string().nullable(),
    message: z.string(),
    get values() {
      return SaidValuesSchema;
    },
  })
  .meta({ id: 'Said' });

const SaidValuesSchema: z.ZodType<SaidValues, SaidValues> = z
  .record(z.string(), z.union([z.string(), z.number(), z.lazy(() => SaidSchema)]))
  .meta({ id: 'SaidValues' });

export { SaidSchema, SaidValuesSchema };
export type { Said, SaidValues };
