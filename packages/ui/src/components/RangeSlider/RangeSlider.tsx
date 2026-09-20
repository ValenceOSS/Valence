import { useState } from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import { Tooltip } from '@ValenceUI/Tooltip';
import { cn } from '@ValenceUI/cn';
import type { RangeSliderProps } from './RangeSlider.types';

const HANDLE = cn(
  'block size-3.5 w-5 rounded-full bg-text shadow outline-none select-none',
  'transition-[scale] duration-[var(--duration-instant)] ease-[var(--ease-out)] motion-reduce:transition-none',
  'hover-hover:hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring',
);

/**
 * A track with two handles on it, for choosing a range from it — a smallest and a largest size,
 * say. The handles cannot pass each other, and each is named for anybody who cannot see them.
 *
 * @param label - What the range is.
 * @param thumbLabels - What each handle chooses, the lower first.
 * @param values - Where the handles are, the lower first.
 * @param max - The top of the track; the bottom is nought.
 * @param step - How far a handle moves at a time.
 * @param onValuesChange - Told where the handles are as they move.
 * @param valueLabel - Says a position in words, which is then shown above both handles whenever the
 *   pointer is over the slider or a handle has focus. The start is said above the track and the end
 *   below it, so two handles close together never stack their times on one another.
 * @param isDisabled - Whether it can be moved.
 * @param className - Classes for the outermost element.
 */
const RangeSlider = ({
  label,
  thumbLabels,
  values,
  max,
  step = 1,
  onValuesChange,
  valueLabel,
  isDisabled = false,
  className,
}: RangeSliderProps) => {
  const [isPointed, setIsPointed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isNamed = valueLabel !== undefined;
  const isShowing = isPointed || isFocused;

  const thumb = (index: 0 | 1) => {
    const handle = <RadixSlider.Thumb aria-label={thumbLabels[index]} className={HANDLE} />;

    return valueLabel === undefined ? (
      handle
    ) : (
      <Tooltip
        label={valueLabel(values[index])}
        side={index === 0 ? 'top' : 'bottom'}
        isOpen={isShowing}
      >
        {handle}
      </Tooltip>
    );
  };

  return (
    <RadixSlider.Root
      aria-label={label}
      value={[...values]}
      min={0}
      max={max}
      step={step}
      minStepsBetweenThumbs={1}
      disabled={isDisabled}
      className={cn(
        'relative flex w-full touch-none items-center py-2 select-none data-[disabled]:opacity-50',
        className,
      )}
      onValueChange={(next) => {
        onValuesChange([next[0] ?? 0, next[1] ?? max]);
      }}
      {...(isNamed
        ? {
            onPointerEnter: () => {
              setIsPointed(true);
            },
            onPointerLeave: () => {
              setIsPointed(false);
            },
            onFocus: () => {
              setIsFocused(true);
            },
            onBlur: () => {
              setIsFocused(false);
            },
          }
        : {})}
    >
      <RadixSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-raised">
        <RadixSlider.Range className="absolute h-full rounded-full bg-text" />
      </RadixSlider.Track>

      {thumb(0)}
      {thumb(1)}
    </RadixSlider.Root>
  );
};

RangeSlider.displayName = 'RangeSlider';

export { RangeSlider };
