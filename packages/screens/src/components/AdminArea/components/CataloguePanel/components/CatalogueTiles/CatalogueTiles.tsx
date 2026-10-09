import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { TITLE_STATUS_NAMES } from '@ValenceClient/requests/TITLE_STATUS_NAMES';
import { TITLE_STATUSES } from '@ValenceContracts/schemas/AdminCatalogue';
import { TITLE_STATUS_TONES } from '@ValenceScreens/requests/TITLE_STATUS_TONES';
import type { TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueTilesProps } from './CatalogueTiles.types';
import { say } from '@ValenceI18n/say';

const EVERY_SWATCH =
  'bg-[linear-gradient(90deg,var(--color-success),var(--color-busy),var(--color-accent),var(--color-highlight),var(--color-danger))]';

/**
 * The Catalogue's statuses as tiles, each its count and its colour, which are both the filter and
 * the key to the bars under the posters. A status nothing stands at is left out, unless it is the
 * one chosen.
 *
 * @param counts - How many titles stand at each status.
 * @param total - How many titles there are in all.
 * @param value - The status chosen, or every one.
 * @param onChange - Told the status chosen.
 */
const CatalogueTiles = ({ counts, total, value, onChange }: CatalogueTilesProps) => {
  const tiles: { id: TitleStatus | 'all'; label: string; count: number; swatch: string }[] = [
    { id: 'all', label: say('common.everything'), count: total, swatch: EVERY_SWATCH },
    ...TITLE_STATUSES.filter((status) => counts[status] > 0 || status === value).map((status) => ({
      id: status,
      label: TITLE_STATUS_NAMES[status],
      count: counts[status],
      swatch: TITLE_STATUS_TONES[status].swatch,
    })),
  ];

  return (
    <div
      role="radiogroup"
      aria-label={say('common.status')}
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7"
    >
      {tiles.map((tile) => (
        <Button
          key={tile.id}
          variant="bare"
          size="none"
          role="radio"
          aria-checked={tile.id === value}
          onClick={() => {
            onChange(tile.id);
          }}
          className={cn(
            'flex flex-col items-start gap-2 rounded-lg border px-3.5 py-3 text-left transition-colors',
            tile.id === value
              ? 'border-[var(--surface-line)] bg-[var(--surface-active)]'
              : 'border-transparent bg-[var(--surface-hover)] hover:bg-[var(--surface-active)]',
          )}
        >
          <span aria-hidden className={cn('h-1 w-6 rounded-full', tile.swatch)} />
          <span className="flex w-full items-baseline justify-between gap-2">
            <span className="text-[0.8125rem] font-medium text-text">{tile.label}</span>
            <span
              className={cn(
                'text-lg font-semibold leading-none tabular-nums',
                tile.id === 'failed' ? 'text-danger' : 'text-text',
              )}
            >
              {tile.count.toString()}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
};

CatalogueTiles.displayName = 'CatalogueTiles';

export { CatalogueTiles };
