import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '@ValenceUI/cn';
import type { RangeSliderProps } from './RangeSlider.types';

const HANDLE = cn(
  'block size-4 rounded-full bg-primary shadow outline-none select-none',
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
  isDisabled = false,
  className,
}: RangeSliderProps) => (
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
  >
    <RadixSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-raised">
      <RadixSlider.Range className="absolute h-full rounded-full bg-primary" />
    </RadixSlider.Track>

    <RadixSlider.Thumb aria-label={thumbLabels[0]} className={HANDLE} />
    <RadixSlider.Thumb aria-label={thumbLabels[1]} className={HANDLE} />
  </RadixSlider.Root>
);

RangeSlider.displayName = 'RangeSlider';

export { RangeSlider };
