import { Checkbox } from '@ValenceUI/Checkbox';
import type { LibraryPickerProps } from './LibraryPicker.types';

/**
 * The libraries a piece of work can be pointed at, each ticked or not, with one box above them that
 * ticks or clears the lot. Each says how many items it holds, since that is what decides how long
 * the work will take.
 *
 * @param libraries - The libraries to choose from.
 * @param chosen - The ids of those chosen.
 * @param onChange - Called with the ids chosen once a box is ticked or cleared.
 */
const LibraryPicker = ({ libraries, chosen, onChange }: LibraryPickerProps) => {
  const isEvery = libraries.length > 0 && libraries.every((library) => chosen.has(library.id));

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-xs uppercase tracking-[0.14em] text-text-muted">
        Libraries
      </legend>

      <Checkbox
        label="Every library"
        checked={isEvery}
        onCheckedChange={(isChecked) => {
          onChange(new Set(isChecked ? libraries.map((library) => library.id) : []));
        }}
      />

      <div className="flex flex-col gap-3 border-l border-line pl-4">
        {libraries.map((library) => (
          <Checkbox
            key={library.id}
            label={library.name}
            description={
              library.itemCount === 1 ? '1 item' : `${library.itemCount.toLocaleString()} items`
            }
            checked={chosen.has(library.id)}
            onCheckedChange={(isChecked) => {
              const next = new Set(chosen);

              if (isChecked) {
                next.add(library.id);
              } else {
                next.delete(library.id);
              }

              onChange(next);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
};

LibraryPicker.displayName = 'LibraryPicker';

export { LibraryPicker };
