import { useRef } from 'react';
import { useInView } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { Logo } from '@ValenceUI/Logo';
import type { ValenceRunProps } from './ValenceRun.types';

/**
 * Valence's name over and over, set apart by its mark, running sideways for ever: two identical halves
 * end to end so the loop never shows its seam. It only runs while it is on screen, and whoever
 * asked for stillness sees it stopped.
 *
 * @param isBackwards - Whether it runs the other way.
 * @param startsAt - How far into the line it starts, in ems, so rows set one above another can
 *   be staggered.
 * @param repeats - How many times the name is written in each half, enough to outlast the space it
 *   runs across.
 * @param isRunning - Whether it runs, where whoever placed it decides that for several runs at
 *   once so they stay in step; left out, it runs while it is itself on screen.
 * @param loopSeconds - How long one half takes to pass, which a longer run needs more of to move
 *   at the same pace; left out, the stylesheet's own.
 * @param className - Its size and spacing, which the caller decides.
 */
const ValenceRun = ({
  isBackwards = false,
  startsAt = 0,
  repeats = 8,
  isRunning,
  loopSeconds,
  className,
}: ValenceRunProps) => {
  const runner = useRef<HTMLDivElement>(null);
  const isSeen = useInView(runner);
  const run = Array.from({ length: repeats }, (_, at) => (
    <span key={at.toString()} className="flex shrink-0 items-center gap-[0.35em] pr-[0.35em]">
      <span>Valence</span>
      <Logo isCurrentColour className="h-[0.5em] translate-y-[0.03em]" />
    </span>
  ));

  return (
    <div
      ref={runner}
      aria-hidden
      style={{
        marginLeft: `${(-startsAt).toString()}em`,
        animationPlayState: (isRunning ?? isSeen) ? 'running' : 'paused',
        ...(loopSeconds === undefined ? {} : { animationDuration: `${loopSeconds.toString()}s` }),
      }}
      className={cn(
        'valence-band-run flex w-max select-none font-body font-extrabold uppercase tracking-[-0.02em]',
        isBackwards ? '[animation-direction:reverse]' : '',
        className,
        'leading-none',
      )}
    >
      {run}
      {run}
    </div>
  );
};

ValenceRun.displayName = 'ValenceRun';

export { ValenceRun };
