import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@ValenceUI/Checkbox';
import { FormField } from '@ValenceUI/FormField';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import type { SeasonChooserProps } from './SeasonChooser.types';

const CHOICES = [
  { id: 'every', label: 'Every season, and later ones' },
  { id: 'some', label: 'Only some seasons' },
] as const;

/**
 * Which of a series' seasons to ask for: every one, and any that come later, or only those ticked
 * — offered as the catalogue lists them, specials among them, each with how many episodes it holds
 * and the year it began.
 *
 * @param tmdbId - The series' catalogue id.
 * @param seasons - The seasons chosen, or null for every one.
 * @param onChange - Told the seasons as they change.
 */
const SeasonChooser = ({ tmdbId, seasons, onChange }: SeasonChooserProps) => {
  const listed = useQuery(requestsQueries.seriesSeasons(seasons === null ? null : tmdbId));

  return (
    <div className="flex flex-col gap-3">
      <FormField label="Seasons">
        <SegmentedRow
          label="Seasons"
          size="sm"
          items={CHOICES}
          value={seasons === null ? 'every' : 'some'}
          onSelect={(next) => {
            onChange(next === 'some' ? [] : null);
          }}
        />
      </FormField>

      {seasons === null ? null : listed.data === undefined ? (
        <Spinner label="Asking the catalogue for its seasons" size="sm" />
      ) : (
        <ul aria-label="Which seasons" className="grid gap-2 sm:grid-cols-2">
          {listed.data.map((one) => (
            <li key={one.season}>
              <Checkbox
                label={one.season === 0 ? 'Specials' : `Season ${one.season.toString()}`}
                description={[
                  `${one.episodeCount.toString()} episode${one.episodeCount === 1 ? '' : 's'}`,
                  ...(one.firstAired === null ? [] : [one.firstAired.slice(0, 4)]),
                ].join(' · ')}
                checked={seasons.includes(one.season)}
                onCheckedChange={(isChecked) => {
                  onChange(
                    (isChecked
                      ? [...seasons, one.season]
                      : seasons.filter((season) => season !== one.season)
                    ).toSorted((left, right) => left - right),
                  );
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

SeasonChooser.displayName = 'SeasonChooser';

export { SeasonChooser };
