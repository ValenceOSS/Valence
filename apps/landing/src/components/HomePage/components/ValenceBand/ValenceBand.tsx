import { useRef } from 'react';
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotionConfig,
  useSpring,
} from 'motion/react';
import type { PointerEvent } from 'react';
import { cn } from '@ValenceUI/cn';
import { ValenceRun } from '@ValenceLanding/components/ValenceRun/ValenceRun';
import type { ValenceBandProps } from './ValenceBand.types';
import { VALENCE_BAND_ID } from './VALENCE_BAND_ID';

const RUN = 'py-[1.1vw] text-[clamp(1.8rem,4.8vw,4.2rem)] xl:py-4';

const LENS_OF_HEIGHT = 0.4;

const GLIDE = { stiffness: 420, damping: 38, mass: 0.6 } as const;

const SWELL = { stiffness: 320, damping: 28 } as const;

/**
 * A band right across the page with Valence's name running past along it, which the app in the
 * hero hangs over: the accent blue with white letters. A circle a little shorter than the band
 * glides along it after the mouse, swelling in as the mouse arrives and shrinking away as it
 * leaves, and inside it the band turns over to blue on white — a second run in those colours, laid
 * over the first and cut to the circle. Whoever asked for stillness sees no circle.
 *
 * @param className - Its place on the page, which the hero decides.
 */
const ValenceBand = ({ className }: ValenceBandProps) => {
  const band = useRef<HTMLDivElement>(null);
  const isSeen = useInView(band);
  const isStill = useReducedMotionConfig() === true;
  const x = useSpring(useMotionValue(0), GLIDE);
  const y = useMotionValue(0);
  const radius = useSpring(0, SWELL);
  const cut = useMotionTemplate`circle(${radius}px at ${x}px ${y}px)`;

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (isStill || event.pointerType !== 'mouse') {
      return;
    }

    const box = event.currentTarget.getBoundingClientRect();

    y.set(box.height / 2);
    radius.set(box.height * LENS_OF_HEIGHT);
    x.set(event.clientX - box.left);
  };

  const arrive = (event: PointerEvent<HTMLDivElement>) => {
    if (isStill || event.pointerType !== 'mouse') {
      return;
    }

    x.jump(event.clientX - event.currentTarget.getBoundingClientRect().left);
    follow(event);
  };

  const hide = () => {
    radius.set(0);
  };

  return (
    <div
      ref={band}
      id={VALENCE_BAND_ID}
      aria-hidden
      onPointerEnter={arrive}
      onPointerMove={follow}
      onPointerLeave={hide}
      className={cn(
        'relative -mx-2 overflow-hidden bg-accent text-accent-contrast sm:-mx-3',
        className,
      )}
    >
      <ValenceRun isRunning={isSeen} className={RUN} />

      {isStill ? null : (
        <motion.div
          style={{ clipPath: cut }}
          className="pointer-events-none absolute inset-0 bg-accent-contrast text-accent"
        >
          <ValenceRun isRunning={isSeen} className={RUN} />
        </motion.div>
      )}
    </div>
  );
};

ValenceBand.displayName = 'ValenceBand';

export { ValenceBand };
