import { cn } from '@ValenceUI/cn';
import { LIT_TEXT } from '@ValenceLanding/components/HomePage/LIT_TEXT';
import type { ValenceRunProps } from './ValenceRun.types';

const RUNS = 8;

/**
 * Valence's name over and over, set apart by dots, running sideways for ever: two identical halves
 * end to end so the loop never shows its seam. Whoever asked for stillness sees it stopped.
 *
 * @param isBackwards - Whether it runs the other way.
 * @param startsAt - How far into the line it starts, in ems, so rows set one above another can
 *   be staggered.
 * @param isLit - Whether the name is lit from below inside a white edge, as the headings are.
 * @param className - Its size and spacing, which the caller decides.
 */
const ValenceRun = ({
  isBackwards = false,
  startsAt = 0,
  isLit = false,
  className,
}: ValenceRunProps) => {
  const run = Array.from({ length: RUNS }, (_, at) => (
    <span key={at.toString()} className="flex shrink-0 items-center gap-[0.35em] pr-[0.35em]">
      <span className={isLit ? LIT_TEXT : ''}>Valence</span>
      <span
        className={cn(
          'inline-block size-[0.22em] rounded-full',
          isLit ? 'bg-on-scrim' : 'bg-current',
        )}
      />
    </span>
  ));

  return (
    <div
      aria-hidden
      style={{ marginLeft: `${(-startsAt).toString()}em` }}
      className={cn(
        'valence-band-run flex w-max select-none font-bold uppercase tracking-[-0.02em]',
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
