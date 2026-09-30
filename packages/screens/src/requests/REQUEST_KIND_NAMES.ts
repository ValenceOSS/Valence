import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

const REQUEST_KIND_NAMES: Readonly<Record<MediaRequestKind, string>> = {
  film: say('common.film'),
  series: say('common.series'),
  artist: say('common.artist'),
  album: say('common.album'),
  book: say('common.book'),
};

export { REQUEST_KIND_NAMES };
