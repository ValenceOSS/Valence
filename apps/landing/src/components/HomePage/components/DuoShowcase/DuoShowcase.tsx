import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotionConfig,
  useSpring,
} from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { useReached } from '@ValenceUI/useReached';
import { VideoSurface } from '@ValenceUI/VideoSurface';
import { Slider } from '@ValenceUI/Slider';
import { Button } from '@ValenceUI/Button';
import { DuoFold } from './components/DuoFold/DuoFold';
import { Airplay as TelevisionIcon } from '@keyline-icons/react/duotone';
import { ByTheWay } from '@ValenceLanding/components/HomePage/components/ByTheWay/ByTheWay';

const OPEN = {
  frame: '/duo/frame-open.webp',
  width: 1323,
  height: 993,
  screen: { left: 49, top: 67, width: 1225, height: 859, radius: 28 },
  body: { left: 25, top: 40, width: 1276, height: 909 },
};

const FOLDED = {
  frame: '/duo/frame-folded.webp',
  width: 1563,
  height: 1173,
  screen: { left: 425, top: 64, width: 731, height: 1045, radius: 90 },
  body: { left: 395, top: 47, width: 777, height: 1074 },
};

const POSTER = '/duo/page-turn-poster.webp';

const FULLY_OPEN = 100;

const SWINGS = { stiffness: 60, damping: 14, mass: 1 };

const SETTLES_AT_ONCE = { stiffness: 2000, damping: 200 };

/**
 * A still of the film as it is now, so the halves show what was on the screen when it began to fold.
 *
 * @param film - The film playing on the open Duo.
 * @returns The frame as an image address, or nothing where there is no frame to take yet.
 */
const stillOf = (film: HTMLVideoElement | null): string | null => {
  if (film === null || film.videoWidth === 0) {
    return null;
  }

  const canvas = document.createElement('canvas');

  canvas.width = film.videoWidth;
  canvas.height = film.videoHeight;
  canvas.getContext('2d')?.drawImage(film, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.9);
};

/**
 * The iPhone Duo opened out, centred, on a book laid out as two pages with its controls in the strip
 * down the side, turning over with the page curl in a short film that loops. A slider under it folds
 * it shut and opens it again, in three dimensions, and the words either side swing it all the way.
 * The film plays only while it is on screen and open, and whoever asked for stillness sees its first
 * frame instead, and the Duo jump between open and folded rather than swing.
 */
const DuoShowcase = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const headingRef = useRef<HTMLDivElement>(null);
  const isHeadingReached = useReached(headingRef, { margin: '-80px' });
  const filmRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useInView(stageRef, { amount: 0.3 });
  const [openness, setOpenness] = useState(FULLY_OPEN);
  const [still, setStill] = useState(POSTER);
  const [isFlat, setIsFlat] = useState(true);
  const swing = useSpring(1, isStill ? SETTLES_AT_ONCE : SWINGS);

  useEffect(() => {
    swing.set(openness / FULLY_OPEN);
  }, [openness, swing]);

  useMotionValueEvent(swing, 'change', (value) => {
    setIsFlat(value >= 0.999);
  });

  const foldTo = (next: number) => {
    if (openness === FULLY_OPEN && next < FULLY_OPEN) {
      setStill(stillOf(filmRef.current) ?? POSTER);
    }

    setOpenness(next);
  };

  useEffect(() => {
    const film = filmRef.current;

    if (film === null) {
      return;
    }

    film.muted = true;

    if (isOnScreen && isFlat && !isStill) {
      void film.play().catch(() => undefined);
    } else {
      film.pause();
    }
  }, [isOnScreen, isFlat, isStill]);

  return (
    <section
      aria-label="Valence on the iPhone Duo"
      className="relative isolate overflow-hidden py-24"
    >
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
        <div className="relative w-[78%]">
          <ByTheWay
            lead="Fun fact..."
            drawing={TelevisionIcon}
            footnote="*TV models from before 2025 (Android)"
            className="right-full top-[6%] mr-10 hidden w-56 min-[1400px]:block"
          >
            Your library plays on Apple TV, Android TV and Fire TV* too, with an app for each.
          </ByTheWay>

          <DuoFold
            open={OPEN}
            folded={FOLDED}
            foldedScreen="/duo/folded-reader.webp"
            still={still}
            openness={swing}
          >
            <VideoSurface
              label="A comic open on the unfolded iPhone Duo as two pages, turning over with a page curl"
              src="/duo/page-turn.mp4"
              poster={POSTER}
              videoRef={filmRef}
              loops
              className="h-full object-cover"
            />
          </DuoFold>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-md items-center gap-4 px-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            foldTo(0);
          }}
        >
          Folded
        </Button>
        <Slider
          label="How far open the iPhone Duo is"
          value={openness}
          max={FULLY_OPEN}
          onValueChange={foldTo}
          valueLabel={(value) => `${value.toString()}% open`}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            foldTo(FULLY_OPEN);
          }}
        >
          Open
        </Button>
      </div>
    </section>
  );
};

DuoShowcase.displayName = 'DuoShowcase';

export { DuoShowcase };
