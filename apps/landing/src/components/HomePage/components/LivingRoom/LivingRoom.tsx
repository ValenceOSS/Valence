import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotionConfig,
  useScroll,
  useTransform,
} from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { webpSourcesOf } from '@ValenceLanding/webpSourcesOf';

const ROOM = '/room/living-room.jpg';

const SCREENS = ['/room/tv-1.jpg', '/room/tv-2.jpg', '/room/tv-3.jpg'] as const;

const SCREEN = { left: '33.27%', top: '27.52%', width: '33.33%', height: '33.26%' } as const;

const STAYS_MS = 4500;

const WORDS = 'relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-4 text-center';

/**
 * The television app in a living room at night: a sofa, a lamp, shelves of films, and on the
 * television, Valence's home taking turns between titles, with what it is written across the wall
 * above. The room settles in as it scrolls into view and the screen's light spills onto the wall
 * around it; whoever asked for stillness sees the room as it is, on its first title. On a phone the
 * room is too short to write over, so the words sit above it.
 */
const LivingRoom = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const isStill = useReducedMotionConfig() === true;
  const [at, setAt] = useState(0);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });
  const scale = useTransform(scrollYProgress, [0, 1], isStill ? [1, 1] : [1.08, 1]);
  const screen = SCREENS[at] ?? SCREENS[0];

  useEffect(() => {
    if (isStill) {
      return undefined;
    }

    const timer = setInterval(() => {
      setAt((was) => (was + 1) % SCREENS.length);
    }, STAYS_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isStill]);

  const heading = (
    <h2 className="text-balance text-4xl font-semibold tracking-tight lg:text-5xl">
      On the sofa, on <span className="font-accent font-normal italic tracking-normal">your</span>{' '}
      server.
    </h2>
  );
  const blurb =
    'The television app puts the whole library on the big screen, on Apple TV and Android TV, and the remote is all it asks for.';

  return (
    <section
      aria-label="Valence on a television"
      className="relative isolate overflow-hidden rounded-[inherit]"
    >
      <div className={cn(WORDS, 'px-5 pb-10 pt-20 text-text sm:hidden')}>
        {heading}
        <p className="max-w-lg text-balance text-lg text-text-muted">{blurb}</p>
      </div>

      <div ref={stageRef} className="relative aspect-[1671/941] w-full overflow-hidden">
        <motion.div style={{ scale }} className="absolute inset-0 origin-[50%_45%]">
          <img
            src={ROOM}
            srcSet={webpSourcesOf(ROOM, [800, 1200, 1671])}
            sizes="100vw"
            loading="lazy"
            alt="A living room at night, with Valence on the television"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
          />

          <AnimatePresence initial={false}>
            <motion.img
              key={`${screen}-glow`}
              src={screen}
              alt=""
              aria-hidden
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              style={{
                left: `calc(${SCREEN.left} - 8%)`,
                top: `calc(${SCREEN.top} - 10%)`,
                width: `calc(${SCREEN.width} + 16%)`,
                height: `calc(${SCREEN.height} + 20%)`,
              }}
              className="pointer-events-none absolute select-none object-cover mix-blend-screen blur-3xl saturate-150"
            />
          </AnimatePresence>

          <div style={SCREEN} className="absolute overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.img
                key={screen}
                src={screen}
                srcSet={webpSourcesOf(screen, [640, 1280])}
                sizes="33vw"
                alt=""
                aria-hidden
                draggable={false}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="absolute inset-0 h-full w-full select-none object-cover"
              />
            </AnimatePresence>
          </div>
        </motion.div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-[42%] bg-gradient-to-b from-shade/85 via-shade/50 to-transparent sm:block"
        />

        <div
          className={cn(
            WORDS,
            'absolute inset-x-0 top-0 hidden px-8 pt-[4%] text-on-scrim sm:flex',
          )}
        >
          {heading}
          <p className="max-w-lg text-balance text-lg text-on-scrim/75">{blurb}</p>
        </div>
      </div>
    </section>
  );
};

LivingRoom.displayName = 'LivingRoom';

export { LivingRoom };
