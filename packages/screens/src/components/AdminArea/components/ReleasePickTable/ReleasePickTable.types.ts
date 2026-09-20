import type { Release, ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';

type ReleasePickTableProps = {
  found: ReleaseSearchOutcome;
  foundAt: number;
  pickingId: string | null;
  emptyMessage: string;
  onPick: (release: Release) => void;
};

export type { ReleasePickTableProps };
