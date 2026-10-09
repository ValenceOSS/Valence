import { TITLE_STATUS_NAMES } from '@ValenceClient/requests/TITLE_STATUS_NAMES';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';
import { say } from '@ValenceI18n/say';

const TITLE_PART_LOOKS: Readonly<
  Record<TitlePart | 'notAsked', { label: string; tone: BadgeTone; cell: string }>
> = {
  library: { label: TITLE_STATUS_NAMES.library, tone: 'success', cell: 'bg-success' },
  downloading: { label: TITLE_STATUS_NAMES.downloading, tone: 'busy', cell: 'bg-busy' },
  missing: { label: TITLE_STATUS_NAMES.missing, tone: 'accent', cell: 'bg-accent' },
  toApprove: { label: TITLE_STATUS_NAMES.toApprove, tone: 'highlight', cell: 'bg-highlight' },
  failed: { label: TITLE_STATUS_NAMES.failed, tone: 'danger', cell: 'bg-danger' },
  notFollowed: { label: TITLE_STATUS_NAMES.notFollowed, tone: 'quiet', cell: 'bg-on-scrim/30' },
  waiting: {
    label: say('common.notOutYet'),
    tone: 'waiting',
    cell: 'bg-on-scrim/20',
  },
  notAsked: {
    label: say('screens.requests.titlePartLooks.notAskedFor'),
    tone: 'quiet',
    cell: 'bg-on-scrim/15',
  },
};

export { TITLE_PART_LOOKS };
