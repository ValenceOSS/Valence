import { z } from 'zod';

const PROBLEM_CODES = [
  'MayNotWriteToLibrary',
  'CannotSeeDownload',
  'CloudflareRefusesAddress',
  'CloudflareCheckFailed',
  'IndexerFailing',
  'VpnDown',
  'VpnKeyRefused',
  'RequestsUnreachable',
  'RequestsSecretRefused',
  'DownloadClientUnreachable',
  'DownloadClientLoginRefused',
] as const;

const ProblemCodeSchema = z.enum(PROBLEM_CODES);

type ProblemCode = z.infer<typeof ProblemCodeSchema>;

const ProblemCodeFieldSchema = z
  .union([ProblemCodeSchema, z.string()])
  .nullable()
  .optional()
  .transform((code): ProblemCode | null => ProblemCodeSchema.safeParse(code).data ?? null);

export type { ProblemCode };

export { PROBLEM_CODES, ProblemCodeFieldSchema, ProblemCodeSchema };
