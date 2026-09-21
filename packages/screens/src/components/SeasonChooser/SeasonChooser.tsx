import { useQuery } from '@tanstack/react-query';
import { FormField } from '@ValenceUI/FormField';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';
import type { SeasonChooserProps } from './SeasonChooser.types';

const HEAD_CELL =
  'px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.14em] text-text-muted sm:px-5';

const CELL = 'px-3 py-3 align-middle sm:px-5';

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
 * The rows are drawn here rather than by `DataTable` so that each switch stays the same element as
 * it is pressed. A table built from column definitions rebuilds them whenever what is ticked
 * changes, which takes the switch away mid-press and loses both its animation and the press.
 *
 * @param tmdbId - The series' catalogue id.
 * @param seasons - The seasons chosen, or null for every one.
 * @param onChange - Told the seasons as they change.
 */
const SeasonChooser = ({ tmdbId, seasons, onChange }: SeasonChooserProps) => {
  const listed = useQuery(requestsQueries.seriesSeasons(tmdbId));
  const rows = listed.data ?? [];
  const ticked = tickedOf(seasons, rows);
  const isEveryOne = rows.length > 0 && ticked.length === rows.length;

  const take = (season: number, isTaken: boolean) => {
    const next = isTaken
      ? ticked.filter((one) => one !== season)
      : [...ticked, season].toSorted((left, right) => left - right);

    onChange(next.length === rows.length ? null : next);
  };

  return (
    <FormField label="Seasons">
      {listed.data === undefined ? (
        <Spinner isCentered label="Asking the catalogue for its seasons" size="sm" />
      ) : rows.length === 0 ? (
        <p className="py-4 text-center font-body text-sm text-text-muted">
          The catalogue lists no seasons for this series.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="valence-rail max-h-64 overflow-y-auto rounded-md border border-[var(--surface-line)]">
            <table className="w-full border-collapse text-sm" aria-label="Which seasons">
              <thead>
                <tr className="sticky top-0 z-10 bg-[var(--card-face)]">
                  <th scope="col" className={`${HEAD_CELL} w-0`}>
                    <Switch
                      label="Every season"
                      isLabelHidden
                      isOn={isEveryOne}
                      onToggle={() => {
                        onChange(isEveryOne ? [] : null);
                      }}
                    />
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Season
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    Episodes
                  </th>
                  <th scope="col" className={HEAD_CELL}>
                    First aired
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((one) => {
                  const isTaken = ticked.includes(one.season);

                  return (
                    <tr key={one.season} className="border-t border-[var(--surface-line)]">
                      <td className={`${CELL} w-0`}>
                        <Switch
                          label={nameSeason(one.season)}
                          isLabelHidden
                          isOn={isTaken}
                          onToggle={() => {
                            take(one.season, isTaken);
                          }}
                        />
                      </td>
                      <td className={`${CELL} whitespace-nowrap text-text`}>
                        {nameSeason(one.season)}
                      </td>
                      <td className={`${CELL} text-text-muted`}>{one.episodeCount.toString()}</td>
                      <td className={`${CELL} whitespace-nowrap text-text-muted`}>
                        {one.firstAired === null ? '—' : one.firstAired.slice(0, 4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
