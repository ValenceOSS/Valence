import { z } from 'zod';
import { say } from '@ValenceI18n/say';

const MEDIA_KINDS = [
  'movie',
  'episode',
  'season',
  'series',
  'album',
  'song',
  'video',
  'book',
] as const;

const MediaKindSchema = z.enum(MEDIA_KINDS);

type MediaKind = (typeof MEDIA_KINDS)[number];

const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  movie: say('common.film'),
  episode: say('common.episode'),
  season: say('common.season'),
  series: say('common.series'),
  album: say('common.album'),
  song: say('contracts.schemas.mediaKind.song'),
  video: say('common.video'),
  book: say('common.book'),
};

export { MEDIA_KIND_LABELS, MEDIA_KINDS, MediaKindSchema };

export type { MediaKind };
