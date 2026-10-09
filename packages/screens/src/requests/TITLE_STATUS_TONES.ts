import type { TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { MediaCardMeter } from '@ValenceUI/MediaCard.types';

const TITLE_STATUS_TONES: Readonly<
  Record<TitleStatus, { badge: BadgeTone; meter: MediaCardMeter['tone']; swatch: string }>
> = {
  library: { badge: 'success', meter: 'success', swatch: 'bg-success' },
  downloading: { badge: 'busy', meter: 'busy', swatch: 'bg-busy' },
  missing: { badge: 'accent', meter: 'gap', swatch: 'bg-accent' },
  toApprove: { badge: 'highlight', meter: 'highlight', swatch: 'bg-highlight' },
  failed: { badge: 'danger', meter: 'danger', swatch: 'bg-danger' },
  notFollowed: { badge: 'quiet', meter: 'quiet', swatch: 'bg-on-scrim/50' },
};

export { TITLE_STATUS_TONES };
