import { Palette as PaletteIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { ColourPicker } from '@ValenceUI/ColourPicker';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { cn } from '@ValenceUI/cn';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { ColourChoiceProps } from './ColourChoice.types';

/**
 * Choosing a colour: the ready ones laid out to be pressed, and one more swatch that opens a picker
 * for any colour at all. A colour chosen there shows in that last swatch, so it stays in view with
 * the ready ones rather than vanishing once the picker is put away.
 *
 * Compact, it is the one swatch alone, for a row that has several colours to choose side by side.
 *
 * @param label - What the colour is for.
 * @param value - The colour now, as `#rrggbb`.
 * @param onChange - Told the new colour.
 * @param presets - The ready colours; the profile colours where none are given.
 * @param isCompact - Whether to show only the swatch that opens the picker.
 * @param className - Extra classes for the caller's own layout.
 */
const ColourChoice = ({
  label,
  value,
  onChange,
  presets = PROFILE_COLOURS,
  isCompact = false,
  className,
}: ColourChoiceProps) => {
  const isOwn = !presets.some((preset) => preset.toLowerCase() === value.toLowerCase());

  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {isCompact
        ? null
        : presets.map((preset) => (
            <Button
              key={preset}
              variant="bare"
              size="none"
              label={`Use ${preset}`}
              isActive={preset.toLowerCase() === value.toLowerCase()}
              style={{ backgroundColor: preset }}
              className={cn(
                'size-8 rounded-full ring-1 ring-line transition-transform',
                preset.toLowerCase() === value.toLowerCase()
                  ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--color-surface-raised)]'
                  : 'hover-hover:hover:scale-110',
              )}
              onClick={() => {
                onChange(preset);
              }}
            />
          ))}

      <PopoverPanel
        label={isCompact ? label : `Any colour for ${label.toLowerCase()}`}
        side="bottom"
        align="start"
        isBare
        trigger={
          <span
            style={isCompact || isOwn ? { backgroundColor: value } : undefined}
            className={cn(
              'flex size-8 items-center justify-center rounded-full ring-1 ring-line',
              !isCompact && !isOwn && 'bg-picker-hues',
              !isCompact &&
                isOwn &&
                'ring-2 ring-accent ring-offset-2 ring-offset-[var(--color-surface-raised)]',
            )}
          >
            {isCompact || isOwn ? null : <Icon of={PaletteIcon} size={14} />}
          </span>
        }
      >
        <ColourPicker label={label} value={value} onChange={onChange} presets={presets} />
      </PopoverPanel>
    </div>
  );
};

ColourChoice.displayName = 'ColourChoice';

export { ColourChoice };
