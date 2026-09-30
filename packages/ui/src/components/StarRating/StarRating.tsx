import { Icon } from '@ValenceUI/Icon';
import { Star as StarIcon } from '@keyline-icons/react';
import { Star as StarFilledIcon } from '@keyline-icons/react/fill';
import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { Button } from '@ValenceUI/Button';
import type { StarRatingProps, StarRatingSize } from './StarRating.types';

const STEPS = [1, 2, 3, 4, 5] as const;

const GLYPH_SIZES: Record<StarRatingSize, number> = { sm: 14, md: 18, lg: 24 };

const GAP_CLASSES: Record<StarRatingSize, string> = { sm: 'gap-0.5', md: 'gap-1', lg: 'gap-1.5' };

const RIPPLE_SECONDS = 0.035;

const WAVE_SECONDS = 0.07;

const SPRING = { type: 'spring', stiffness: 520, damping: 20 } as const;

/**
 * Shows a rating out of five as a row of stars, and takes one where it is given a way to report it.
 * Read-only it fills fractionally, so a household average of 4.2 is drawn as four stars and a fifth
 * mostly filled rather than rounded to something nobody gave it. That is done by drawing all five
 * filled stars at full size and clipping them, which is why the filled row is sized to its content
 * and its glyphs refuse to shrink: left to flex them, they fit themselves to the clip instead of
 * being cut by it, and a three out of five came out as five squashed stars. Interactive it fills in
 * whole steps
 * only, previews under a pointer, and treats pressing the star already given as taking the rating
 * back — which is the one gesture a row of stars otherwise has no room for.
 *
 * Interactive, it moves: pointing lights the stars up to the pointer in a quick ripple, each lifting
 * a little on a spring, and giving a rating fills the row as a wave, each star up to the one pressed
 * popping in turn. Where somebody has asked for less movement the stars simply fill.
 *
 * @param stars - What has been given, or null where nothing has.
 * @param label - What is being rated, for anybody not looking at the screen.
 * @param onRate - Called with the rating pressed; its absence is what makes the row read-only.
 * @param onClear - Called when the star already given is pressed again.
 * @param size - How large to draw the stars.
 * @param isDisabled - Whether the row is inert, as it is while a rating is being written.
 * @param className - Extra classes for the caller's own layout.
 */
const StarRating = ({
  stars,
  label,
  onRate,
  onClear,
  size = 'md',
  isDisabled = false,
  className,
}: StarRatingProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [wave, setWave] = useState({ to: 0, times: 0 });

  const glyph = GLYPH_SIZES[size];
  const given = stars ?? 0;

  if (onRate === undefined) {
    const filled = Math.min(Math.max(given, 0), STEPS.length) / STEPS.length;

    return (
      <span
        className={cn('relative inline-flex w-fit', GAP_CLASSES[size], className)}
        role="img"
        aria-label={`${label}: ${given.toFixed(1)} out of 5`}
      >
        <span className={cn('flex text-text-muted', GAP_CLASSES[size])} aria-hidden>
          {STEPS.map((step) => (
            <Icon of={StarIcon} key={step} size={glyph} />
          ))}
        </span>

        <span
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ width: `${(filled * 100).toString()}%` }}
          aria-hidden
        >
          <span className={cn('flex w-max text-amber-400', GAP_CLASSES[size])}>
            {STEPS.map((step) => (
              <Icon of={StarIcon} key={step} size={glyph} className="shrink-0" />
            ))}
          </span>
        </span>
      </span>
    );
  }

  const shown = hovered ?? given;

  return (
    <span
      className={cn('inline-flex w-fit', GAP_CLASSES[size], className)}
      role="radiogroup"
      aria-label={label}
      onPointerLeave={() => {
        setHovered(null);
      }}
    >
      {STEPS.map((step) => {
        const isLit = step <= shown;

        return (
          <Button
            key={step}
            variant="bare"
            size="none"
            isIconOnly
            role="radio"
            aria-checked={step === given}
            label={`${label}: ${step.toString()} of 5`}
            disabled={isDisabled}
            className={cn(
              'rounded-sm p-0.5 transition-colors duration-200',
              isLit ? 'text-amber-400' : 'text-text-muted',
            )}
            onPointerEnter={() => {
              setHovered(step);
            }}
            onFocus={() => {
              setHovered(step);
            }}
            onClick={() => {
              if (step === given) {
                onClear?.();

                return;
              }

              setWave((was) => ({ to: step, times: was.times + 1 }));
              onRate(step);
            }}
          >
            <motion.span
              key={step <= wave.to ? `wave-${wave.times.toString()}` : 'still'}
              className="flex"
              onAnimationComplete={() => {
                if (step === wave.to) {
                  setWave((was) => ({ ...was, to: 0 }));
                }
              }}
              animate={
                step <= wave.to && wave.times > 0
                  ? { scale: [1, 1.4, 1], rotate: [0, -14, 0] }
                  : { scale: hovered !== null && isLit ? 1.14 : 1, rotate: 0 }
              }
              transition={
                step <= wave.to && wave.times > 0
                  ? { duration: 0.42, ease: 'easeOut', delay: (step - 1) * WAVE_SECONDS }
                  : {
                      ...SPRING,
                      delay: hovered !== null && isLit ? (step - 1) * RIPPLE_SECONDS : 0,
                    }
              }
            >
              <Icon of={StarIcon} whenActive={StarFilledIcon} size={glyph} isActive={isLit} />
            </motion.span>
          </Button>
        );
      })}
    </span>
  );
};

StarRating.displayName = 'StarRating';

export { StarRating };
