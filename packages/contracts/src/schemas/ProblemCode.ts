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

export type { ProblemCode };

export { PROBLEM_CODES, ProblemCodeSchema };
