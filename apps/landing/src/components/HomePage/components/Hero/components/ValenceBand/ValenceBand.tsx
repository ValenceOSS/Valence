import { cn } from '@ValenceUI/cn';
import type { ValenceBandProps } from './ValenceBand.types';

const RUNS = 8;

/**
 * A light band right across the page with Valence's name running past along it, set apart by dots,
 * which the app in the hero hangs over. Two identical halves run end to end so the loop never shows
 * its seam; whoever asked for stillness sees it stopped.
 *
 * @param className - Its place on the page, which the hero decides.
 */
const ValenceBand = ({ className }: ValenceBandProps) => {
  const run = Array.from({ length: RUNS }, (_, at) => (
    <span key={at.toString()} className="flex shrink-0 items-center gap-[0.35em] pr-[0.35em]">
      <span>Valence</span>
      <span className="inline-block size-[0.22em] rounded-full bg-current" />
    </span>
  ));

  return (
    <div
      aria-hidden
      className={cn('relative -mx-2 overflow-hidden bg-text py-3 text-surface sm:-mx-3', className)}
    >
      <div className="valence-band-run flex w-max select-none pt-[9vw] text-[clamp(3rem,8vw,7rem)] font-bold uppercase leading-none tracking-[-0.02em] xl:pt-[8rem]">
        {run}
        {run}
      </div>
    </div>
  );
};

ValenceBand.displayName = 'ValenceBand';

export { ValenceBand };
