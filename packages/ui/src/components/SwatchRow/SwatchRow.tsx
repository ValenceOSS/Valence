import { cn } from '@ValenceUI/cn';
import { Button } from '@ValenceUI/Button';
import type { SwatchRowProps } from './SwatchRow.types';

/**
 * A choice of colour drawn as the colours themselves, one dot each, with the chosen one ringed. A
 * colour named in words has to be imagined, and a row of words wraps; a row of dots is read at a
 * glance and stays one line. Each still says its name, to anybody who cannot see it and to a pointer
 * resting on it.
 *
 * @param label - What the colour is for, read out to anybody who cannot see the row.
 * @param swatches - The colours, each a CSS colour for its id and what to call it.
 * @param value - The colour in force.
 * @param onSelect - Told which colour was pressed.
 * @param className - Extra classes for the caller's own layout.
 */
const SwatchRow = ({ label, swatches, value, onSelect, className }: SwatchRowProps) => (
  <div
    role="group"
    aria-label={label}
    className={cn('flex flex-wrap items-center gap-2.5', className)}
  >
    {swatches.map((swatch) => (
      <Button
        key={swatch.id}
        variant="bare"
        size="none"
        isIconOnly
        label={swatch.label}
        isActive={swatch.id === value}
        onClick={() => {
          onSelect(swatch.id);
        }}
        className={cn(
          'size-6 rounded-full outline-solid outline-2 outline-offset-2',
          'transition-[outline-color,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
          'motion-reduce:transition-none hover:scale-110 active:scale-95',
          swatch.id === value ? 'outline-text' : 'outline-transparent',
        )}
      >
        <span
          aria-hidden
          className="size-full rounded-full border border-[var(--surface-line)]"
          style={{ backgroundColor: swatch.id }}
        />
      </Button>
    ))}
  </div>
);

SwatchRow.displayName = 'SwatchRow';

export { SwatchRow };
