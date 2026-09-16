import { motion, useReducedMotionConfig } from 'motion/react';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { FeatureVisualProps } from './FeatureVisual.types';

const FRAME =
  'relative flex h-full min-h-32 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-surface-raised/40';

const BAR_HEIGHTS = [32, 58, 42, 74, 48, 66, 36, 52, 44] as const;

const PEAK_BAR_INDEX = 3;

const FeatureVisual = ({ kind, icon }: FeatureVisualProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const canLoop = prefersReducedMotion !== true;

  if (kind === 'window') {
    return (
      <div className={cn(FRAME, 'flex-col')}>
        <span className="flex w-full items-center gap-1.5 border-b border-border/60 bg-surface-raised/60 px-3 py-2">
          <span className="size-1.5 rounded-full bg-danger/60" />
          <span className="size-1.5 rounded-full bg-text-muted/40" />
          <span className="size-1.5 rounded-full bg-text-muted/40" />
        </span>

        <span className="relative flex flex-1 items-center justify-center">
          <span aria-hidden className="absolute size-16 rounded-full bg-accent/15 blur-xl" />

          <motion.span
            {...(canLoop
              ? {
                  animate: { y: [0, -5, 0] },
                  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                }
              : {})}
            className="relative flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-accent"
          >
            <Icon of={icon} size={22} />
          </motion.span>
        </span>
      </div>
    );
  }

  if (kind === 'waveform') {
    return (
      <div className={FRAME}>
        <span className="flex h-16 items-end gap-1.5">
          {BAR_HEIGHTS.map((height, index) => (
            <motion.span
              key={height}
              style={{ height: `${height.toString()}%` }}
              {...(canLoop
                ? {
                    animate: { scaleY: [1, 0.55, 1] },
                    transition: {
                      duration: 1.3,
                      repeat: Infinity,
                      delay: index * 0.08,
                      ease: 'easeInOut',
                    },
                  }
                : {})}
              className={cn(
                'w-1.5 origin-bottom rounded-full',
                index === PEAK_BAR_INDEX ? 'bg-accent' : 'bg-accent/30',
              )}
            />
          ))}
        </span>
      </div>
    );
  }

  if (kind === 'orbit') {
    return (
      <div className={FRAME}>
        <span aria-hidden className="absolute size-24 rounded-full border border-accent/20" />
        <span aria-hidden className="absolute size-16 rounded-full border border-accent/30" />

        <motion.span
          aria-hidden
          {...(canLoop
            ? {
                animate: { rotate: 360 },
                transition: { duration: 14, repeat: Infinity, ease: 'linear' },
              }
            : {})}
          className="absolute size-24"
        >
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-accent" />
          <span className="absolute bottom-0 left-0 size-1.5 rounded-full bg-accent/50" />
          <span className="absolute bottom-0 right-0 size-1.5 rounded-full bg-accent/50" />
        </motion.span>

        <span className="relative flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Icon of={icon} size={20} />
        </span>
      </div>
    );
  }

  return (
    <div className={FRAME}>
      <span
        aria-hidden
        className="absolute h-20 w-16 -translate-x-4 -rotate-[8deg] rounded-lg border border-border/60 bg-surface-raised/60"
      />
      <span
        aria-hidden
        className="absolute h-20 w-16 translate-x-4 rotate-[8deg] rounded-lg border border-border/60 bg-surface-raised/60"
      />

      <motion.span
        {...(canLoop
          ? {
              animate: { y: [0, -4, 0] },
              transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
            }
          : {})}
        className="relative flex h-20 w-16 items-center justify-center rounded-lg border border-border/60 bg-surface-raised text-accent shadow-[var(--shadow-raised)]"
      >
        <Icon of={icon} size={22} />
      </motion.span>
    </div>
  );
};

FeatureVisual.displayName = 'FeatureVisual';

export { FeatureVisual };
