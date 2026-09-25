import type { ExtraKind } from '@ValenceContracts/schemas/Library';

const EXTRA_FOLDERS: ReadonlyMap<string, ExtraKind> = new Map<string, ExtraKind>([
  ['trailers', 'trailer'],
  ['backdrops', 'other'],
  // eslint-disable-next-line valence/no-hard-coded-strings -- a folder name matched on disk
  ['behind the scenes', 'behindTheScenes'],
  // eslint-disable-next-line valence/no-hard-coded-strings -- a folder name matched on disk
  ['deleted scenes', 'deletedScene'],
  ['interviews', 'interview'],
  ['scenes', 'scene'],
  ['samples', 'sample'],
  ['shorts', 'short'],
  ['featurettes', 'featurette'],
  ['extras', 'other'],
  ['extra', 'other'],
  ['other', 'other'],
  ['clips', 'clip'],
]);

export { EXTRA_FOLDERS };
