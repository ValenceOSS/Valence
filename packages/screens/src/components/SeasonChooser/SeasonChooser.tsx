import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { FormField } from '@ValenceUI/FormField';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { SEASON_STANDING_NAMES } from '@ValenceClient/requests/SEASON_STANDING_NAMES';
import { theSeasonsTicked } from '@ValenceClient/requests/theSeasonsTicked';
import { tickASeason } from '@ValenceClient/requests/tickASeason';
import type { CatalogueSeason, SeasonStanding } from '@ValenceContracts/schemas/MediaRequest';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { SeasonChooserProps } from './SeasonChooser.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const STANDING_TONES: Readonly<Record<SeasonStanding, BadgeTone>> = {
  askable: 'quiet',
  requested: 'waiting',
  partly: 'busy',
  library: 'success',
};

/**
 * Which of a series' seasons to ask for, as a row each: how many episodes it holds and the year it
 * began, with a switch to take it and one in the header to take the lot.
 *
 * Taking every season is kept as every season rather than as a list of the ones there are today, so
 * a series still running goes on being fetched as it airs. Ticking them one by one comes to the
 * same thing, which is what a person ticking all of them means.
 *
 * Each season says where it stands, so nobody asks again for what is already on the shelf.
 *
 * @param tmdbId - The series' catalogue id.
 * @param seasons - The seasons chosen, or null for every one.
 * @param onChange - Told the seasons as they change.
 */
const SeasonChooser = ({ tmdbId, seasons, onChange }: SeasonChooserProps) => {
  const listed = useQuery(requestsQueries.seriesSeasons(tmdbId));
  const rows = useMemo(() => listed.data ?? [], [listed.data]);
  const ticked = useMemo(() => theSeasonsTicked(seasons, rows), [seasons, rows]);
  const isEveryOne = rows.length > 0 && ticked.length === rows.length;

  const columns = useMemo<DataTableColumn<CatalogueSeason>[]>(
    () => [
      {
        id: 'take',
        enableSorting: false,
        header: () => (
          <Switch
            label={say('screens.seasonChooser.everySeason')}
            isLabelHidden
            isOn={isEveryOne}
            onToggle={() => {
              onChange(isEveryOne ? [] : null);
            }}
          />
        ),
        cell: ({ row }) => {
          const isTaken = ticked.includes(row.original.season);

          return (
            <Switch
              label={nameSeason(row.original.season)}
              isLabelHidden
              isOn={isTaken}
              onToggle={() => {
                onChange(tickASeason(seasons, rows, row.original.season));
              }}
            />
          );
        },
      },
      {
        id: 'season',
        header: say('screens.seasonChooser.season'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text">
            {nameSeason(row.original.season)}
          </span>
        ),
      },
      {
        id: 'episodes',
        header: say('screens.seasonChooser.episodes'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-text-muted">{row.original.episodeCount.toString()}</span>
        ),
      },
      {
        id: 'aired',
        header: say('screens.seasonChooser.firstAired'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text-muted">
            {row.original.firstAired === null ? '—' : row.original.firstAired.slice(0, 4)}
          </span>
        ),
      },
      {
        id: 'standing',
        header: say('screens.seasonChooser.status'),
        enableSorting: false,
        cell: ({ row }) => (
          <Badge size="sm" tone={STANDING_TONES[row.original.standing]}>
            {SEASON_STANDING_NAMES[row.original.standing]}
          </Badge>
        ),
      },
    ],
    [isEveryOne, onChange, rows, seasons, ticked],
  );

  return (
    <FormField label={say('screens.seasonChooser.seasons')}>
      {listed.data === undefined ? (
        <Spinner isCentered label={say('screens.seasonChooser.asking')} size="sm" />
      ) : (
        <div className="flex flex-col gap-2">
          <DataTable
            label={say('screens.seasonChooser.whichSeasons')}
            columns={columns}
            rows={rows}
            getRowId={(one) => one.season.toString()}
            height="compact"
            emptyMessage={say('screens.seasonChooser.noSeasons')}
          />

          <p className="text-xs text-text-muted">
            {isEveryOne
              ? say('screens.seasonChooser.everyOne')
              : ticked.length === 0
                ? say('screens.seasonChooser.noneTaken')
                : sayCount('screens.seasonChooser.someTaken', rows.length, {
                    ticked: ticked.length.toString(),
                  })}
          </p>
        </div>
      )}
    </FormField>
  );
};

SeasonChooser.displayName = 'SeasonChooser';

export { SeasonChooser };
