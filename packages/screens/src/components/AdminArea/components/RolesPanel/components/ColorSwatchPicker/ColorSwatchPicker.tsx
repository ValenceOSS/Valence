import { Check as CheckIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { ROLE_COLOURS } from '@ValenceUI/tokens/roleColours';
import type { ColorSwatchPickerProps } from './ColorSwatchPicker.types';

/**
 * A swatch of the colours a role may be given, standing for what its name is drawn in wherever a
 * member holding it is shown. A blank tile at the front is no colour at all — the ordinary text
 * colour, for a role that is not meant to stand out.
 *
 * @param value - The colour currently chosen, or null for none.
 * @param onChange - Told which colour was chosen.
 * @param className - Extra classes for the caller's own layout.
 */
const ColorSwatchPicker = ({ value, onChange, className }: ColorSwatchPickerProps) => (
  <div className={cn('flex flex-wrap gap-2', className)}>
    <Button
      variant="glossy"
      size="sm"
      isIconOnly
      isPill
      label="No colour"
      onClick={() => {
        onChange(null);
      }}
    >
      {value === null ? <Icon of={CheckIcon} size={14} tone="strong" /> : null}
    </Button>

    {ROLE_COLOURS.map((swatch) => (
      <Button
        key={swatch}
        variant="bare"
        size="none"
        isPill
        label={swatch}
        onClick={() => {
          onChange(swatch);
        }}
        style={{ backgroundColor: swatch }}
        className="flex size-8 shrink-0 items-center justify-center"
      >
        {value?.toLowerCase() === swatch.toLowerCase() ? (
          <Icon of={CheckIcon} size={14} tone="scrim" className="drop-shadow" />
        ) : null}
      </Button>
    ))}
  </div>
);

ColorSwatchPicker.displayName = 'ColorSwatchPicker';

export { ColorSwatchPicker };
