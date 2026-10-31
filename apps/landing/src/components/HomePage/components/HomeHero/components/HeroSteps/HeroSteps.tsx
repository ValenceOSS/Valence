import { motion } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { HeroStepsProps } from './HeroSteps.types';

/**
 * The short story told under the app's window, a step to a column: each with a thin bar along its
 * top that fills while it is showing, its title bright while it is the one in the window and
 * quieter while it is not. Pressing a step puts it in the window. Whoever asked for stillness sees
 * the bar of the step showing full and nothing filling.
 *
 * @param steps - The steps, in order.
 * @param active - Which step is showing.
 * @param progress - How far through the showing step it is, from 0 to 1.
 * @param isStill - Whether nothing should fill.
 * @param onSelect - Puts a step in the window.
 * @param className - Where the caller places it.
 */
const HeroSteps = ({ steps, active, progress, isStill, onSelect, className }: HeroStepsProps) => (
  <ol className={cn('grid gap-x-8 gap-y-5 sm:grid-cols-3', className)}>
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
              'group flex w-full flex-col items-start gap-3 rounded-md text-left transition-opacity duration-[var(--duration-base)]',
              isActive
                ? 'opacity-100'
                : isStill
                  ? 'opacity-80 hover:opacity-100'
                  : 'opacity-55 hover:opacity-85',
            )}
          >
            <span
              aria-hidden
              className="relative block h-0.5 w-full overflow-hidden rounded-full bg-[var(--surface-line)]"
            >
              {isActive ? (
                <motion.span
                  className="absolute inset-0 block origin-left rounded-full bg-text"
                  style={isStill ? { scaleX: 1 } : { scaleX: progress }}
                />
              ) : null}
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-base font-semibold text-text sm:text-lg">{step.title}</span>
              <span className="text-pretty text-sm text-text-muted sm:text-base">
                {step.detail}
              </span>
            </span>
          </Button>
        </li>
      );
    })}
  </ol>
);

HeroSteps.displayName = 'HeroSteps';

export { HeroSteps };
