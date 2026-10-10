import { nameSeason } from '@ValenceClient/library/nameSeason';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import type { SeasonPickerProps } from './SeasonPicker.types';
import { say } from '@ValenceI18n/say';

const idOf = (seasonNumber: number | null): string => String(seasonNumber ?? 'specials');

/**
 * Chooses which season of a programme to read, as a menu drawn as one part of a joined row of
 * controls, so it lists every season at once however many there are. A season the library does
 * not hold is still offered, and said not to be held.
 *
 * @param seasons - Every season to choose from, in order, and whether the library holds each.
 * @param value - The season being read.
 * @param onChange - Told the season chosen.
 */
const SeasonPicker = ({ seasons, value, onChange }: SeasonPickerProps) => {
  const choose = (id: string) => {
    onChange(id === 'specials' ? null : Number(id));
  };

  return (
    <OptionMenu
      label={say('common.season')}
      triggerShape="segment"
      align="end"
      trigger={
        <>
          {nameSeason(value)}
          <Icon of={ChevronDownIcon} size={14} tone="muted" className="shrink-0" />
        </>
      }
      groups={[
        {
          name: say('common.season'),
          options: seasons.map((one) => ({
            id: idOf(one.seasonNumber),
            label: nameSeason(one.seasonNumber),
            ...(one.isHeld ? {} : { detail: say('common.notInYourLibrary') }),
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
