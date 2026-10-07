import { useRef } from 'react';
import { useInView } from 'motion/react';
import type { PointerEvent } from 'react';
import { cn } from '@ValenceUI/cn';
import { ValenceRun } from '@ValenceLanding/components/ValenceRun/ValenceRun';
import type { ValenceBandProps } from './ValenceBand.types';
import { VALENCE_BAND_ID } from './VALENCE_BAND_ID';

const RUN = 'py-[1.8vw] text-[clamp(3rem,8vw,7rem)] xl:py-7';

const LENS = '7rem';

/**
 * A band right across the page with Valence's name running past along it, which the app in the
 * hero hangs over: the accent blue with white letters. A ring follows the mouse across it, and
 * inside the ring it turns over to blue on white — a second run in those colours, laid over the
 * first and cut to a circle where the pointer is.
 *
 * @param className - Its place on the page, which the hero decides.
 */
const ValenceBand = ({ className }: ValenceBandProps) => {
  const band = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const isSeen = useInView(band);

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || lens.current === null) {
      return;
    }

    const box = event.currentTarget.getBoundingClientRect();

    lens.current.style.setProperty('--lens-x', `${(event.clientX - box.left).toString()}px`);
    lens.current.style.setProperty('--lens-y', `${(event.clientY - box.top).toString()}px`);
    lens.current.style.setProperty('--lens-r', LENS);
  };

  const hide = () => {
    lens.current?.style.setProperty('--lens-r', '0px');
  };

  return (
    <div
      ref={band}
      id={VALENCE_BAND_ID}
      aria-hidden
      onPointerMove={follow}
      onPointerLeave={hide}
      className={cn(
        'relative -mx-2 overflow-hidden bg-accent text-accent-contrast sm:-mx-3',
        className,
      )}
    >
      <ValenceRun isRunning={isSeen} className={RUN} />

      <div
        ref={lens}
        className="pointer-events-none absolute inset-0 bg-accent-contrast text-accent transition-[clip-path] duration-150 ease-out [clip-path:circle(var(--lens-r,0px)_at_var(--lens-x,50%)_var(--lens-y,50%))]"
      >
        <ValenceRun isRunning={isSeen} className={RUN} />
      </div>
    </div>
  );
};

ValenceBand.displayName = 'ValenceBand';

export { ValenceBand };
