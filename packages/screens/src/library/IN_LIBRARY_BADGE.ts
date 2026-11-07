import type { MediaCardBadge } from '@ValenceUI/MediaCard.types';
import { say } from '@ValenceI18n/say';

const IN_LIBRARY_BADGE: MediaCardBadge = {
  label: say('screens.askableDialog.describeCatalogueCard.inLibrary'),
  tone: 'success',
};

export { IN_LIBRARY_BADGE };
