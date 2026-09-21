import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@ValenceUI/DataTable';
import { FormField } from '@ValenceUI/FormField';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { SeasonChooserProps } from './SeasonChooser.types';

/**
 * Which seasons are ticked, where every one of them is what null means.
 *
 * @param seasons - The seasons chosen, or null for every one.
 * @param listed - Every season the catalogue lists.
 * @returns The season numbers ticked.
 */
const tickedOf = (seasons: number[] | null, listed: readonly CatalogueSeason[]): number[] =>
  seasons ?? listed.map((one) => one.season);

/**
 * Which of a series' seasons to ask for, as a row each: how many episodes it holds and the year it
 * began, with a switch to take it and one in the header to take the lot.
 *
 * Taking every season is kept as every season rather than as a list of the ones there are today, so
 * a series still running goes on being fetched as it airs. Ticking them one by one comes to the
 * same thing, which is what a person ticking all of them means.
 *
 * @param tmdbId - The series' catalogue id.
 * @param seasons - The seasons chosen, or null for every one.
 * @param onChange - Told the seasons as they change.
 */
const SeasonChooser = ({ tmdbId, seasons, onChange }: SeasonChooserProps) => {
  const listed = useQuery(requestsQueries.seriesSeasons(tmdbId));
  const rows = useMemo(() => listed.data ?? [], [listed.data]);
  const ticked = useMemo(() => tickedOf(seasons, rows), [seasons, rows]);
  const isEveryOne = rows.length > 0 && ticked.length === rows.length;

  const columns = useMemo<DataTableColumn<CatalogueSeason>[]>(
    () => [
      {
        id: 'take',
        enableSorting: false,
        header: () => (
          <Switch
            label="Every season"
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
                const next = isTaken
                  ? ticked.filter((season) => season !== row.original.season)
                  : [...ticked, row.original.season];

                onChange(
                  next.length === rows.length ? null : next.toSorted((left, right) => left - right),
                );
              }}
            />
          );
        },
      },
      {
        id: 'season',
        header: 'Season',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text">
            {nameSeason(row.original.season)}
          </span>
        ),
      },
      {
        id: 'episodes',
        header: 'Episodes',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-text-muted">{row.original.episodeCount.toString()}</span>
        ),
      },
      {
        id: 'aired',
        header: 'First aired',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text-muted">
            {row.original.firstAired === null ? '—' : row.original.firstAired.slice(0, 4)}
          </span>
        ),
      },
    ],
    [isEveryOne, onChange, rows, ticked],
  );

  return (
    <FormField label="Seasons">
      {listed.data === undefined ? (
        <Spinner isCentered label="Asking the catalogue for its seasons" size="sm" />
      ) : (
        <div className="flex flex-col gap-2">
          <DataTable
            label="Which seasons"
            columns={columns}
            rows={rows}
            getRowId={(one) => one.season.toString()}
            height="compact"
            emptyMessage="The catalogue lists no seasons for this series."
          />

          <p className="text-xs text-text-muted">
            {isEveryOne
              ? 'Every season, and any that come later.'
              : ticked.length === 0
                ? 'No season is taken yet.'
                : `${ticked.length.toString()} of ${rows.length.toString()} seasons.`}
          </p>
        </div>
      )}
    </FormField>
  );
};

SeasonChooser.displayName = 'SeasonChooser';

export { SeasonChooser };
