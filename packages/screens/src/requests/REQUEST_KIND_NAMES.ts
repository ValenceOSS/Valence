import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

const REQUEST_KIND_NAMES: Readonly<Record<MediaRequestKind, string>> = {
  get film() {
    return say('screens.requestKindNames.film');
  },
  get series() {
    return say('screens.requestKindNames.series');
  },
  get artist() {
    return say('screens.requestKindNames.artist');
  },
  get album() {
    return say('screens.requestKindNames.album');
  },
  get book() {
    return say('screens.requestKindNames.book');
  },
};

export { REQUEST_KIND_NAMES };
