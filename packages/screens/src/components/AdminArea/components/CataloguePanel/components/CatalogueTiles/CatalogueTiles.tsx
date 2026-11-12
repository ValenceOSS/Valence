import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { TITLE_STATUS_NAMES } from '@ValenceClient/requests/TITLE_STATUS_NAMES';
import { TITLE_STATUSES } from '@ValenceContracts/schemas/AdminCatalogue';
import { TITLE_STATUS_TONES } from '@ValenceScreens/requests/TITLE_STATUS_TONES';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueTilesProps } from './CatalogueTiles.types';
import { say } from '@ValenceI18n/say';

/**
 * The Catalogue's statuses as a row of pills to filter by, each with its colour, its name and how
 * many titles stand there, the same colour the badge on each poster wears. A status nothing stands
 * at is left out, unless it is the one chosen.
 *
 * @param counts - How many titles stand at each status.
 * @param total - How many titles there are in all.
 * @param value - The status chosen, or every one.
 * @param onChange - Told the status chosen.
 */
const CatalogueTiles = ({ counts, total, value, onChange }: CatalogueTilesProps) => {
  const pills: {
    id: TitleStatus | 'all';
    label: string;
    count: number;
    swatch: string | null;
    tone: BadgeTone;
  }[] = [
    { id: 'all', label: say('common.everything'), count: total, swatch: null, tone: 'quiet' },
    ...TITLE_STATUSES.filter((status) => counts[status] > 0 || status === value).map((status) => ({
      id: status,
      label: TITLE_STATUS_NAMES[status],
      count: counts[status],
      swatch: TITLE_STATUS_TONES[status].swatch,
      tone: status === 'failed' ? ('danger' as const) : ('quiet' as const),
    })),
  ];

  return (
    <div
      role="radiogroup"
      aria-label={say('common.status')}
      className="valence-rail -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1"
    >
      {pills.map((pill) => (
        <Button
          key={pill.id}
          variant="bare"
          size="none"
          role="radio"
          aria-checked={pill.id === value}
          onClick={() => {
            onChange(pill.id);
          }}
          className={cn(
            'flex h-8 shrink-0 items-center gap-2 rounded-full border pl-3 pr-1.5 text-[0.8125rem] font-medium transition-colors',
            pill.id === value
              ? 'border-[var(--surface-line)] bg-[var(--surface-active)] text-text'
              : 'border-transparent text-text-muted hover:bg-[var(--surface-hover)] hover:text-text',
          )}
        >
          {pill.swatch === null ? null : (
            <span aria-hidden className={cn('size-2 rounded-full', pill.swatch)} />
          )}
          {pill.label}
          <Badge size="count" tone={pill.tone} className="min-w-6">
            {pill.count.toLocaleString()}
          </Badge>
        </Button>
      ))}
    </div>
  );
};

CatalogueTiles.displayName = 'CatalogueTiles';

export { CatalogueTiles };
