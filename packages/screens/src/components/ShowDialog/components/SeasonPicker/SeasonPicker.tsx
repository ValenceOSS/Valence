import { nameSeason } from '@ValenceClient/library/nameSeason';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import type { SeasonPickerProps } from './SeasonPicker.types';
import { say } from '@ValenceI18n/say';

const MOST_ON_A_TRACK = 6;

const idOf = (seasonNumber: number | null): string => String(seasonNumber ?? 'specials');

/**
 * Chooses which season of a programme to read, drawn as a track while there are few enough to fit
 * across and as a menu once there are not — a track of nine or ten runs off the edge of the dialog
 * and has to be scrolled sideways to find the season wanted, where a menu lists them all at once.
 * A season the library does not hold is still offered, and said not to be held.
 *
 * @param seasons - Every season to choose from, in order, and whether the library holds each.
 * @param value - The season being read.
 * @param onChange - Told the season chosen.
 */
const SeasonPicker = ({ seasons, value, onChange }: SeasonPickerProps) => {
  const choose = (id: string) => {
    onChange(id === 'specials' ? null : Number(id));
  };

  if (seasons.length <= MOST_ON_A_TRACK) {
    return (
      <SegmentedRow
        size="sm"
        tone="accent"
        label={say('screens.seasonPicker.whichSeason')}
        items={seasons.map((one) => ({
          id: idOf(one.seasonNumber),
          label: nameSeason(one.seasonNumber),
          ...(one.isHeld ? {} : { isAbsent: true }),
        }))}
        value={idOf(value)}
        onSelect={choose}
      />
    );
  }

  return (
    <OptionMenu
      label={say('screens.seasonPicker.whichSeason')}
      triggerShape="field"
      align="end"
      trigger={nameSeason(value)}
      groups={[
        {
          name: say('screens.seasonPicker.season'),
          options: seasons.map((one) => ({
            id: idOf(one.seasonNumber),
            label: nameSeason(one.seasonNumber),
            ...(one.isHeld ? {} : { detail: say('screens.seasonPicker.notInLibrary') }),
          })),
          selectedId: idOf(value),
          onSelect: choose,
        },
      ]}
    />
  );
};

SeasonPicker.displayName = 'SeasonPicker';

export { SeasonPicker };
