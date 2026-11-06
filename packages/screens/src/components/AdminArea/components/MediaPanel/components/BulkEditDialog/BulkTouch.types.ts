import type { TitleValue } from '@ValenceContracts/schemas/TitleEdit';

type BulkTouch =
  | { kind: 'set'; value: TitleValue }
  | { kind: 'clear' }
  | { kind: 'reset' }
  | { kind: 'fromTitle' }
  | { kind: 'words'; how: 'add' | 'remove' | 'replace'; words: readonly string[] }
  | { kind: 'rating'; rating: string | null };

export type { BulkTouch };
