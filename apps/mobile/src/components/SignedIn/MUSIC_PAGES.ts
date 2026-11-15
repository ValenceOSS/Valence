import type { APage } from './SignedIn.types';

const MUSIC_PAGES: ReadonlySet<APage['kind']> = new Set([
  'album',
  'artist',
  'playlist',
  'liked',
  'mix',
  'albums',
  'artists',
]);

export { MUSIC_PAGES };
