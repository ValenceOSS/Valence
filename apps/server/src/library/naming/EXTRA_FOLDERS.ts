import type { ExtraKind } from '@ValenceContracts/schemas/Library';

const EXTRA_FOLDERS: ReadonlyMap<string, ExtraKind> = new Map<string, ExtraKind>([
  ['trailers', 'trailer'],
  ['backdrops', 'other'],
  ['behind the scenes', 'behindTheScenes'],
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
