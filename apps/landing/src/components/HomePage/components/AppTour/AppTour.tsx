import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Doodle } from '@ValenceUI/Doodle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';

const STOPS = [
  {
    id: 'home',
    label: 'Home',
    src: '/devices/web.jpg',
    alt: 'The home page, with a film featured across the top',
  },
  {
    id: 'library',
    label: 'Library',
    src: '/hero-2.jpeg',
    alt: 'Rows of films to carry on watching, picked out and recently added',
  },
  {
    id: 'music',
    label: 'Music',
    src: '/changelog/music-requests-and-households.png',
    alt: 'An album, its tracks beneath its cover and the player along the foot',
  },
  {
    id: 'books',
    label: 'Books',
    src: '/changelog/phones-and-audiobooks-books.png',
    alt: 'A shelf of books and audiobooks',
  },
  {
    id: 'server',
    label: 'Server',
    src: '/hero-3.jpeg',
    alt: 'The server overview, with the processor, memory, storage and streams',
  },
] as const;

const STAYS_FOR_MS = 5000;

/**
 * A walk round the app itself: one window, and a row of the places in it — home, the library, music,
 * books, the server — which fades from one real screenshot to the next, by itself every few seconds
 * or straight away when one is chosen. Whoever asked for stillness sees it change only when they
 * choose.
 */
const AppTour = () => {
  const isStill = useReducedMotionConfig() === true;
  const [showing, setShowing] = useState<string>(STOPS[0].id);
  const [isTouched, setIsTouched] = useState(false);
  const shown = STOPS.find((stop) => stop.id === showing) ?? STOPS[0];

  useEffect(() => {
    if (isStill || isTouched) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setShowing((was) => {
        const at = STOPS.findIndex((stop) => stop.id === was);

        return STOPS[(at + 1) % STOPS.length]?.id ?? STOPS[0].id;
      });
    }, STAYS_FOR_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isStill, isTouched]);

  return (
    <section
      aria-label="A look round the app"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-10 xl:max-w-7xl"
    >
      <div className="mb-10 flex flex-col items-center gap-5 text-center">
        <h2 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-text lg:text-5xl">
          One app for everything you{' '}
          <span className="font-accent font-normal italic tracking-normal">own</span>.
        </h2>

        <div className="relative">
          <SegmentedRow
            label="Parts of the app"
            size="md"
            items={STOPS}
            value={showing}
            onSelect={(id) => {
              setIsTouched(true);
              setShowing(id);
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-full top-1/2 ml-5 hidden w-36 -translate-y-1/2 lg:block"
          >
            <span className="block -rotate-6 font-hand text-xl leading-none text-text-muted">
              real screenshots
            </span>
            <Doodle of="sparks" delay={0.3} className="ml-4 mt-1 h-6 w-8 text-accent" />
          </span>
        </div>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-shade shadow-[var(--shadow-cast)] ring-1 ring-border/60 sm:rounded-3xl">
        <AnimatePresence initial={false}>
          <motion.img
            key={shown.id}
            src={shown.src}
            alt={shown.alt}
            draggable={false}
            initial={{ opacity: 0, scale: isStill ? 1 : 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isStill ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full select-none object-cover object-top"
          />
        </AnimatePresence>
      </div>
    </section>
  );
};

AppTour.displayName = 'AppTour';

export { AppTour };
