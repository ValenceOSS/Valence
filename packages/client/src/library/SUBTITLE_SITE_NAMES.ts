import type { SubtitleSource } from '@ValenceContracts/schemas/SubtitleFinding';

const SUBTITLE_SITE_NAMES = {
  opensubtitles: 'OpenSubtitles',
  subdl: 'SubDL',
} as const satisfies Record<SubtitleSource, string>;

export { SUBTITLE_SITE_NAMES };
