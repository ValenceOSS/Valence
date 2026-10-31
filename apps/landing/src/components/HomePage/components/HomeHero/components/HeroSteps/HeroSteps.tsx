import { motion } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { HeroStepsProps } from './HeroSteps.types';

/**
 * The short story told under the app's window, as numbered tiles in one tray like the screens
 * beneath it: the step in the window sits on a solid tile with its title bright and a thin bar at
 * its foot filling while it shows, and the others rest on the tray, quieter, until the pointer finds
 * them. Pressing a step puts it in the window. Whoever asked for stillness sees the bar of the step
 * showing full and nothing filling.
 *
 * @param steps - The steps, in order.
 * @param active - Which step is showing.
 * @param progress - How far through the showing step it is, from 0 to 1.
 * @param isStill - Whether nothing should fill.
 * @param onSelect - Puts a step in the window.
 * @param className - Where the caller places it.
 */
const HeroSteps = ({ steps, active, progress, isStill, onSelect, className }: HeroStepsProps) => (
  <ol
    className={cn(
      'grid gap-1.5 rounded-[1.6rem] border border-[var(--surface-line)] bg-[var(--frame-panel)] p-1.5 sm:grid-cols-3',
      className,
    )}
  >
    {steps.map((step, at) => {
      const isActive = at === active;

      return (
        <li key={step.id} className="flex">
          <Button
            variant="bare"
            size="none"
            isActive={isActive}
            onClick={() => {
              onSelect(at);
            }}
            className={cn(
              'flex w-full flex-col items-start gap-4 rounded-[1.15rem] p-5 text-left transition-colors duration-[var(--duration-base)] sm:p-6',
              isActive
                ? 'bg-[var(--frame-card)]'
                : 'hover:bg-[color-mix(in_oklab,var(--frame-card)_50%,transparent)]',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'text-sm font-medium tabular-nums transition-colors',
                isActive ? 'text-text' : 'text-text-muted',
              )}
            >
              {(at + 1).toString().padStart(2, '0')}
            </span>
            <span className="flex flex-col gap-1">
              <span
                className={cn(
                  'text-base font-semibold tracking-[-0.01em] transition-colors sm:text-lg',
                  isActive ? 'text-text' : 'text-text-muted',
                )}
              >
                {step.title}
              </span>
              <span className="text-pretty text-sm text-text-muted sm:text-base">
                {step.detail}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                'relative mt-auto block h-0.5 w-full overflow-hidden rounded-full',
                isActive ? 'bg-[var(--surface-line)]' : 'bg-transparent',
              )}
            >
              {isActive ? (
                <motion.span
                  className="absolute inset-0 block origin-left rounded-full bg-text"
                  style={isStill ? { scaleX: 1 } : { scaleX: progress }}
                />
              ) : null}
            </span>
          </Button>
        </li>
      );
    })}
  </ol>
);

HeroSteps.displayName = 'HeroSteps';

export { HeroSteps };
