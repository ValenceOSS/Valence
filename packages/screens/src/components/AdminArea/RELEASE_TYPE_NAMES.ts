import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';

const RELEASE_TYPE_NAMES: Readonly<Record<ReleaseType, { label: string; one: string }>> = {
  album: { label: 'Albums', one: 'Album' },
  ep: { label: 'EPs', one: 'EP' },
  single: { label: 'Singles', one: 'Single' },
  live: { label: 'Live', one: 'Live' },
  compilation: { label: 'Compilations', one: 'Compilation' },
};

export { RELEASE_TYPE_NAMES };
