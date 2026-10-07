import { useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { useReached } from '@ValenceUI/useReached';
import { VideoSurface } from '@ValenceUI/VideoSurface';
import { DuoFrame } from './components/DuoFrame/DuoFrame';
import { Monitor as TelevisionIcon } from '@keyline-icons/react/duotone';
import { ByTheWay } from '@ValenceLanding/components/HomePage/components/ByTheWay/ByTheWay';

const OPEN = {
  frame: '/duo/frame-open.webp',
  width: 1323,
  height: 993,
  screen: { left: 49, top: 67, width: 1225, height: 859, radius: 28 },
};

/**
 * The iPhone Duo opened out, centred, on a book laid out as two pages with its controls in the strip
 * down the side, turning over with the page curl in a short film that loops. The film plays only while it is on screen, and whoever asked for
 * stillness sees its first frame instead.
 */
const DuoShowcase = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const headingRef = useRef<HTMLDivElement>(null);
  const isHeadingReached = useReached(headingRef, { margin: '-80px' });
  const filmRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useInView(stageRef, { amount: 0.3 });

  useEffect(() => {
    const film = filmRef.current;

    if (film === null) {
      return;
    }

    film.muted = true;

    if (isOnScreen && !isStill) {
      void film.play().catch(() => undefined);
    } else {
      film.pause();
    }
  }, [isOnScreen, isStill]);

  return (
    <section
      aria-label="Valence on the iPhone Duo"
      className="relative isolate overflow-hidden py-24"
    >
      <ByTheWay
        drawing={TelevisionIcon}
        className="right-[2%] top-[50%] hidden w-56 min-[1400px]:block"
      >
        The same server plays on Apple TV, Android TV and Fire TV too.
      </ByTheWay>
      <motion.div
        ref={headingRef}
        initial="hidden"
        animate={isHeadingReached ? 'shown' : 'hidden'}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'bouncy')}
        className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-4 px-5 text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">iPhone Duo</p>
        <h2 className="text-balance text-4xl font-semibold tracking-tight text-text lg:text-5xl">
          Folded or open,{' '}
          <span className="font-accent font-normal italic tracking-normal">it fits</span>.
        </h2>
        <p className="max-w-lg text-balance text-lg text-text-muted">
          On the iPhone Duo the controls move into the strip down the side, and opened, a book lies
          across both halves as two pages, turned with a page curl.
        </p>
      </motion.div>

      <div ref={stageRef} className="mx-auto flex max-w-5xl justify-center px-5">
        <DuoFrame {...OPEN} className="w-[78%]">
          <VideoSurface
            label="A comic open on the unfolded iPhone Duo as two pages, turning over with a page curl"
            src="/duo/page-turn.mp4"
            poster="/duo/page-turn-poster.webp"
            videoRef={filmRef}
            loops
            className="h-full object-cover"
          />
        </DuoFrame>
      </div>
    </section>
  );
};

DuoShowcase.displayName = 'DuoShowcase';

export { DuoShowcase };
