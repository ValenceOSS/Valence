import type { ExtraKind } from '@ValenceContracts/schemas/Library';
import type { EpisodeNumbering } from '@ValenceServer/library/EpisodeNumbering.types';
import type { ExternalIds } from '@ValenceServer/library/naming/ExternalIds.types';

type FoundExtra = {
  kind: ExtraKind;
  parentPath: string | null;
  seriesFolder: string | null;
};

type FoundVersion = {
  parentPath: string;
  label: string;
};

type Placement = {
  isIgnored: boolean;
  title: string;
  year: number | null;
  episode: EpisodeNumbering;
  ids: ExternalIds;
  nfoPaths: string[];
  extra: FoundExtra | null;
  version: FoundVersion | null;
};

export type { FoundExtra, FoundVersion, Placement };
