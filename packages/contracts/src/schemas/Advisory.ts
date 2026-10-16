import { z } from 'zod';

const ADVISORIES = [
  'violence',
  'language',
  'sex',
  'nudity',
  'drugs',
  'frightening',
  'discrimination',
] as const;

const AdvisorySchema = z.enum(ADVISORIES);

const ContentAdviceSchema = z.record(z.string(), z.array(AdvisorySchema));

type Advisory = z.infer<typeof AdvisorySchema>;

type ContentAdvice = z.infer<typeof ContentAdviceSchema>;

export type { Advisory, ContentAdvice };

export { ADVISORIES, AdvisorySchema, ContentAdviceSchema };
