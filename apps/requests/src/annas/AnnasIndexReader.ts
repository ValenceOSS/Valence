import type { AnnasBookRecord } from '@ValenceRequests/annas/AnnasBookRecord';
import type { AnnasWanted } from '@ValenceRequests/annas/AnnasWanted';

type AnnasIndexSink = {
  keep: (books: readonly AnnasBookRecord[]) => Promise<void>;
  onRead: (read: number) => void;
};

type AnnasIndexReader = (
  file: string,
  wanted: AnnasWanted,
  sink: AnnasIndexSink,
) => Promise<number>;

export type { AnnasIndexReader, AnnasIndexSink };
