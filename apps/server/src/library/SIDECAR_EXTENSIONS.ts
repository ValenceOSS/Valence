import { TEXT_SUBTITLE_EXTENSIONS } from '@ValenceContracts/constants/TEXT_SUBTITLE_EXTENSIONS';

const SIDECAR_EXTENSIONS: ReadonlySet<string> = new Set([
  ...TEXT_SUBTITLE_EXTENSIONS,
  'sub',
  'idx',
  'sup',
  'nfo',
  'jpg',
  'jpeg',
  'png',
  'webp',
]);

export { SIDECAR_EXTENSIONS };
