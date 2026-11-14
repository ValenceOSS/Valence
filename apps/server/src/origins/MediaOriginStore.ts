import type { RecordedSource } from '@ValenceContracts/schemas/MediaOrigin';

type RecordedOrigin = {
  libraryId: string;
  path: string;
  source: RecordedSource;
  via: string | null;
};

type MediaOriginStore = {
  record: (origins: readonly RecordedOrigin[]) => Promise<void>;
  recordUnlessKnown: (origins: readonly RecordedOrigin[]) => Promise<void>;
  read: (
    paths: readonly string[],
  ) => Promise<Record<string, Pick<RecordedOrigin, 'source' | 'via'>>>;
};

export type { MediaOriginStore, RecordedOrigin };
