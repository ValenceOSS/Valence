import { Checkbox } from '@ValenceUI/Checkbox';
import type { AskerPickerProps } from './AskerPicker.types';

/**
 * Who a quality profile is for, as roles or as accounts, each ticked or not, with one box above
 * them that clears the lot.
 *
 * Clearing every box is what opens a profile to the house rather than what closes it to everybody:
 * a profile naming nobody is nobody's in particular, so the box above reads as anybody rather than
 * as none. Ticking it clears the rest for that reason.
 *
 * @param legend - What is being chosen from.
 * @param everyLabel - What clearing the lot means, in words.
 * @param askers - Who there is to choose.
 * @param chosen - The ids of those chosen.
 * @param onChange - Called with the ids chosen once a box is ticked or cleared.
 */
const AskerPicker = ({ legend, everyLabel, askers, chosen, onChange }: AskerPickerProps) => (
  <fieldset className="flex flex-col gap-3">
    <legend className="mb-3 text-xs uppercase tracking-[0.14em] text-text-muted">{legend}</legend>

    <Checkbox
      label={everyLabel}
      checked={chosen.size === 0}
      onCheckedChange={(isChecked) => {
        if (isChecked) {
          onChange(new Set());
        }
      }}
    />

    <div className="flex flex-col gap-3 border-l border-line pl-4">
      {askers.map((asker) => (
        <Checkbox
          key={asker.id}
          label={asker.name}
          {...(asker.detail === undefined ? {} : { description: asker.detail })}
          checked={chosen.has(asker.id)}
          onCheckedChange={(isChecked) => {
            const next = new Set(chosen);

            if (isChecked) {
              next.add(asker.id);
            } else {
              next.delete(asker.id);
            }

            onChange(next);
          }}
        />
      ))}
    </div>
  </fieldset>
);

AskerPicker.displayName = 'AskerPicker';

export { AskerPicker };
