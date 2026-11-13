import { Palette as PaletteIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { ColourPicker } from '@ValenceUI/ColourPicker';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { cn } from '@ValenceUI/cn';
import { inkFor } from '@ValenceClient/library/inkFor';
import { colourName } from '@ValenceClient/profiles/colourName';
import { swatchRing } from '@ValenceScreens/components/ColourChoice/swatchRing';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { ColourChoiceProps } from './ColourChoice.types';
import { say } from '@ValenceI18n/say';

/**
 * Choosing a colour: the ready ones laid out to be pressed, and one more swatch that opens a picker
 * for any colour at all, a palette ringed by every hue. A colour chosen there fills that last
 * swatch inside its ring, the palette drawn dark or light on it to be read, so it stays in view with
 * the ready ones rather than vanishing once the picker is put away.
 *
 * Compact, it is the one swatch alone, for a row that has several colours to choose side by side:
 * the same swatch, filled with the colour once one is chosen there.
 *
 * @param label - What the colour is for.
 * @param value - The colour now, as `#rrggbb`, or empty where none is chosen yet.
 * @param onChange - Told the new colour.
 * @param presets - The ready colours; the profile colours where none are given.
 * @param clear - Offers no colour at all first, as a see-through swatch, where it is wanted: whether
 *   it is the one chosen, and what to tell when it is.
 * @param isCompact - Whether to show only the swatch that opens the picker.
 * @param className - Extra classes for the caller's own layout.
 */
const ColourChoice = ({
  label,
  value,
  onChange,
  presets = PROFILE_COLOURS,
  clear,
  isCompact = false,
  className,
}: ColourChoiceProps) => {
  const isOwn =
    value !== '' &&
    (isCompact || !presets.some((preset) => preset.toLowerCase() === value.toLowerCase()));

  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {clear === undefined || isCompact ? null : (
        <Button
          variant="bare"
          size="none"
          label={say('common.transparent')}
          isActive={clear.isChosen}
          className={cn(
            'size-8 rounded-full ring-1 ring-line',
            'bg-[repeating-conic-gradient(var(--color-text-muted)_0_25%,transparent_0_50%)] bg-[length:10px_10px]',
            swatchRing(clear.isChosen),
          )}
          onClick={clear.onChoose}
        />
      )}
      {isCompact
        ? null
        : presets.map((preset) => (
            <Button
              key={preset}
              variant="bare"
              size="none"
              label={colourName(preset)}
              isActive={preset.toLowerCase() === value.toLowerCase()}
              style={{ backgroundColor: preset }}
              className={cn(
                'size-8 rounded-full ring-1 ring-line',
                swatchRing(preset.toLowerCase() === value.toLowerCase()),
              )}
              onClick={() => {
                onChange(preset);
              }}
            />
          ))}

      <PopoverPanel
        label={isCompact ? label : say('screens.colourChoice.customColour')}
        side="bottom"
        tooltipSide="top"
        align="start"
        triggerLook="inline"
        trigger={
          <span
            className={cn(
              'flex size-8 items-center justify-center rounded-full bg-picker-wheel',
              swatchRing(isOwn),
            )}
          >
            <span
              style={isOwn ? { backgroundColor: value } : undefined}
              className={cn(
                'flex size-[1.625rem] items-center justify-center rounded-full',
                !isOwn
                  ? 'bg-surface-raised text-text'
                  : inkFor(value) === 'dark'
                    ? 'text-letter-dark'
                    : 'text-letter-light',
              )}
            >
              <Icon of={PaletteIcon} size={17} />
            </span>
          </span>
        }
      >
        <ColourPicker label={label} value={value} onChange={onChange} />
      </PopoverPanel>
    </div>
  );
};

ColourChoice.displayName = 'ColourChoice';

export { ColourChoice };
