import type { IconName } from './IconNameSchema';

const ICON_GLYPHS = {
  alert: 'CircleAlert',
  book: 'Book',
  check: 'Check',
  clock: 'Clock',
  download: 'Download',
  film: 'Film',
  heart: 'Heart',
  info: 'Info',
  link: 'Link',
  list: 'List',
  music: 'MusicNote',
  play: 'Play',
  plus: 'Plus',
  refresh: 'RefreshCw',
  search: 'Search',
  settings: 'Settings',
  star: 'Star',
  trash: 'Bin',
  tv: 'Monitor',
  upload: 'Upload',
  user: 'CircleUser',
  x: 'X',
} as const satisfies Record<IconName, string>;

type IconGlyphName = (typeof ICON_GLYPHS)[IconName];

export type { IconGlyphName };

export { ICON_GLYPHS };
