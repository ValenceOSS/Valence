import { say } from '@ValenceI18n/say';

type ShowStatusKind = 'returning' | 'production' | 'planned' | 'ended' | 'cancelled';

type ShowStatusTone = 'success' | 'busy' | 'accent' | 'quiet' | 'danger';

type ShowStatusLook = { kind: ShowStatusKind; label: string; tone: ShowStatusTone };

const LOOKS: Readonly<Record<string, ShowStatusLook>> = {
  'returning series': {
    kind: 'returning',
    label: say('screens.showStatusBadge.returning'),
    tone: 'success',
  },
  'in production': {
    kind: 'production',
    label: say('screens.showStatusBadge.inProduction'),
    tone: 'busy',
  },
  planned: { kind: 'planned', label: say('screens.showStatusBadge.planned'), tone: 'accent' },
  pilot: { kind: 'planned', label: say('screens.showStatusBadge.pilot'), tone: 'accent' },
  ended: { kind: 'ended', label: say('screens.showStatusBadge.ended'), tone: 'quiet' },
  canceled: { kind: 'cancelled', label: say('screens.showStatusBadge.cancelled'), tone: 'danger' },
  cancelled: { kind: 'cancelled', label: say('screens.showStatusBadge.cancelled'), tone: 'danger' },
};

/**
 * How a programme's status is shown, the same on every client: what it is called in Valence's own
 * words, how loudly it is coloured, and which kind it is, so each client can mark it with its own
 * icon — or nothing where the catalogue said something Valence does not know.
 *
 * @param status - The status as the catalogue gives it, such as Returning Series.
 * @returns How to show it, or nothing for a status Valence does not know.
 */
const describeShowStatus = (status: string): ShowStatusLook | null =>
  LOOKS[status.trim().toLowerCase()] ?? null;

export type { ShowStatusKind, ShowStatusLook, ShowStatusTone };

export { describeShowStatus };
