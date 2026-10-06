import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import {
  BookOpen as BookOpenIcon,
  Film as FilmIcon,
  Home as HomeIcon,
  MusicNote as MusicNoteIcon,
  Server as ServerIcon,
} from '@keyline-icons/react';
import {
  BookOpen as BookOpenFilledIcon,
  Film as FilmFilledIcon,
  Home as HomeFilledIcon,
  MusicNote as MusicNoteFilledIcon,
  Server as ServerFilledIcon,
} from '@keyline-icons/react/fill';
import { Doodle } from '@ValenceUI/Doodle';
import { Icon } from '@ValenceUI/Icon';
import { NavBar } from '@ValenceUI/NavBar';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';

const STOPS = [
  {
    id: 'home',
    label: 'Home',
    icon: HomeIcon,
    activeIcon: HomeFilledIcon,
    says: 'What to carry on with, what is new, and something picked out for tonight.',
    src: '/devices/web.jpg',
    alt: 'The home page, with a film featured across the top',
  },
  {
    id: 'library',
    label: 'Library',
    icon: FilmIcon,
    activeIcon: FilmFilledIcon,
    says: 'Every film and series on the server, with its artwork, cast and where you left off.',
    src: '/hero-2.jpeg',
    alt: 'Rows of films to carry on watching, picked out and recently added',
  },
  {
    id: 'music',
    label: 'Music',
    icon: MusicNoteIcon,
    activeIcon: MusicNoteFilledIcon,
    says: 'Albums, artists, lyrics and mixes made from what you play, with the player along the foot.',
    src: '/changelog/music-requests-and-households.png',
    alt: 'An album, its tracks beneath its cover and the player along the foot',
  },
  {
    id: 'books',
    label: 'Books',
    icon: BookOpenIcon,
    activeIcon: BookOpenFilledIcon,
    says: 'Books to read and audiobooks to listen to, each remembering the page you were on.',
    src: '/changelog/phones-and-audiobooks-books.png',
    alt: 'A shelf of books and audiobooks',
  },
  {
    id: 'server',
    label: 'Server',
    icon: ServerIcon,
    activeIcon: ServerFilledIcon,
    says: 'How the machine is doing, who is watching, and the jobs it is getting on with.',
    src: '/hero-3.jpeg',
    alt: 'The server overview, with the processor, memory, storage and streams',
  },
] as const;

const STAYS_FOR_MS = 5000;

/**
 * A walk round the app itself: a line about it, then the app's own bar of places — home, the
 * library, music, books, the server, each with its icon, or a plain row of them on a phone, where
 * the app's bar folds into a menu — over one window in a rim of glass, which fades from one real screenshot to the
 * next with a line saying what that place is for, by itself every few seconds or straight away
 * when one is chosen. Whoever asked for stillness sees it change only when they
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
      <div className="mb-8 flex flex-col items-center gap-5 text-center">
        <h2 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-text lg:text-5xl">
          One app for everything you{' '}
          <span className="font-accent font-normal italic tracking-normal">own</span>.
        </h2>

        <p className="max-w-2xl text-balance text-lg text-text-muted">
          Films, series, music and books in one place, from the same server, with the admin pages
          that run it a click away.
        </p>
      </div>

      <div className="mb-4 flex justify-center md:hidden">
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
      </div>

      <NavBar
        className="relative z-10 mb-4 hidden md:block"
        solidity={0}
        items={STOPS.map((stop) => ({
          id: stop.id,
          label: stop.label,
          icon: <Icon of={stop.icon} size={18} />,
          activeIcon: <Icon of={stop.activeIcon} size={18} />,
        }))}
        selectedId={showing}
        onSelect={(id) => {
          setIsTouched(true);
          setShowing(id);
        }}
      />

      <div className="mb-8 grid min-h-[1.75rem] place-items-center text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={shown.id}
            initial={{ opacity: 0, y: isStill ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isStill ? 0 : -6 }}
            transition={{ duration: isStill ? 0 : 0.3 }}
            className="max-w-xl text-balance text-text-muted"
          >
            {shown.says}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-14 z-10 hidden w-40 lg:block xl:-right-16"
        >
          <span className="block rotate-6 font-hand text-2xl leading-none text-text-muted">
            real screenshots
          </span>
          <Doodle
            of="sparks"
            delay={0.3}
            className="ml-auto mr-6 mt-1 h-6 w-8 rotate-12 text-accent"
          />
        </span>

        <div className="valence-glass valence-glass--film rounded-[1rem] p-1.5 shadow-[var(--shadow-cast)] sm:rounded-[1.6rem] sm:p-2">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[0.7rem] bg-shade sm:rounded-[1.1rem]">
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
        </div>
      </div>
    </section>
  );
};

AppTour.displayName = 'AppTour';

export { AppTour };
