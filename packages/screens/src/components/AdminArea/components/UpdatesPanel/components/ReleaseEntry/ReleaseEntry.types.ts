import type { PublishedRelease } from '@ValenceContracts/schemas/PublishedRelease';

type ReleaseEntryProps = {
  release: PublishedRelease;
  isOpenAtFirst: boolean;
  now: number;
};

export type { ReleaseEntryProps };
