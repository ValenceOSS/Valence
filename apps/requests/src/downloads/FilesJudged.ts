import type { Said } from '@ValenceI18n/SaidSchema';

type FilesJudged = { refusal: Said | null; skipping: readonly string[] };

export type { FilesJudged };
