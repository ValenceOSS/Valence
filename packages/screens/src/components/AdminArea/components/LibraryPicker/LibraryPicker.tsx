import { useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { Check as CheckIcon } from '@keyline-icons/react/fill';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { LibraryPickerProps } from './LibraryPicker.types';

/**
 * The libraries a piece of work can be pointed at, as tiles that each tick on and off, with how many
 * are chosen and one button to choose or clear them all.
 *
 * @param libraries - The libraries to choose from.
 * @param chosen - The ids of those chosen.
 * @param onChange - Called with the ids chosen once a tile is pressed.
 */
const LibraryPicker = ({ libraries, chosen, onChange }: LibraryPickerProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const count = libraries.filter((library) => chosen.has(library.id)).length;
  const isEvery = libraries.length > 0 && count === libraries.length;

  return (
    <fieldset className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-xs font-medium text-text-muted">
          {say('screens.adminArea.libraryPicker.chosenOfCount', {
            chosen: count.toString(),
            count: libraries.length.toString(),
          })}
        </legend>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            onChange(new Set(isEvery ? [] : libraries.map((library) => library.id)));
          }}
        >
          {isEvery ? say('common.clear') : say('screens.adminArea.libraryPicker.selectAll')}
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-2">
        {libraries.map((library) => {
          const isChosen = chosen.has(library.id);

          return (
            <Button
              key={library.id}
              variant="row"
              size="none"
              role="checkbox"
              aria-checked={isChosen}
              onClick={() => {
                const next = new Set(chosen);

                if (isChosen) {
                  next.delete(library.id);
                } else {
                  next.add(library.id);
                }

                onChange(next);
              }}
              className={cn(
                'flex items-center gap-3 rounded-xl p-3 text-start ring-1 ring-inset',
                prefersReducedMotion === true ? '' : 'transition-colors duration-150',
                isChosen
                  ? 'bg-[var(--surface-hover)] ring-primary/60'
                  : 'ring-[var(--surface-line)]',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  isChosen
                    ? 'bg-primary/15 text-primary'
                    : 'bg-[var(--surface-hover)] text-text-muted',
                )}
              >
                <Icon of={LIBRARY_KIND_NAMES[library.kind].icon} size={17} />
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-text">{library.name}</span>
                <span className="text-xs text-text-muted">
                  {library.itemCount === 1
                    ? say('common.n1Item')
                    : sayCount('common.count.items', library.itemCount)}
                </span>
              </span>

              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full transition-colors',
                  isChosen
                    ? 'bg-primary text-primary-foreground'
                    : 'ring-1 ring-inset ring-[var(--surface-divider)]',
                )}
              >
                {isChosen ? <Icon of={CheckIcon} size={12} /> : null}
              </span>
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
};

LibraryPicker.displayName = 'LibraryPicker';

export { LibraryPicker };
