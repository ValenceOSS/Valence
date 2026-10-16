import { useRef } from 'react';
import { useReducedMotionConfig, useScroll, useTransform } from 'motion/react';
import { FannedPhone } from './components/FannedPhone/FannedPhone';
import { Language as LanguageIcon } from '@keyline-icons/react/duotone';
import { ByTheWay } from '@ValenceLanding/components/HomePage/components/ByTheWay/ByTheWay';

const PHONES = [
  {
    label: 'Your books',
    turn: -16,
    lift: 70,
    spread: -2,
    finish: 'blue',
    src: '/phones/books.jpg',
  },
  {
    label: 'Music home',
    turn: -8,
    lift: 26,
    spread: -1,
    finish: 'silver',
    src: '/phones/music.jpg',
  },
  { label: 'Now playing', turn: 0, lift: 0, spread: 0, finish: 'blue', src: '/phones/playing.jpg' },
  { label: 'Home', turn: 8, lift: 26, spread: 1, finish: 'silver', src: '/phones/home.jpg' },
  { label: 'Your films', turn: 16, lift: 70, spread: 2, finish: 'blue', src: '/phones/films.jpg' },
] as const;

/**
 * The phone app, as a hand of cards: five phones fanned out from the one in the middle, each showing
 * a different part of it, over the words for where Valence goes drawn as an outline behind them. They
 * open out from a stack as the section scrolls into view; whoever asked for stillness sees them
 * open.
 */
const PhoneFan = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const isStill = useReducedMotionConfig() === true;
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });
  const opened = useTransform(scrollYProgress, [0.15, 0.85], isStill ? [1, 1] : [0, 1]);
  return (
    <section aria-label="Valence on a phone" className="relative isolate overflow-hidden py-28">
      <ByTheWay
        lead="By the way..."
        drawing={LanguageIcon}
        className="left-[5%] top-44 hidden xl:block"
      >
        The phone app speaks 23 languages, right to left included.
      </ByTheWay>
      <p
        aria-hidden
        className="valence-outline-text pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center text-[11vw] font-bold uppercase leading-none tracking-[-0.03em] text-text/20"
      >
        Every screen
      </p>

      <div className="relative mx-auto mb-20 flex max-w-2xl flex-col lg:mb-24 xl:mb-28 items-center gap-4 px-5 text-center">
        <h2 className="text-balance text-4xl font-semibold tracking-tight text-text lg:text-5xl">
          In your pocket, on{' '}
          <span className="font-accent font-normal italic tracking-normal">your</span> server.
        </h2>
        <p className="max-w-lg text-balance text-lg text-text-muted">
          The phone app plays your music, films and books from your own server, at home or away, and
          keeps them for the train.
        </p>
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto flex h-[30rem] max-w-7xl items-start justify-center sm:h-[37rem] lg:h-[43rem] xl:h-[48rem]"
      >
        {PHONES.map((phone) => (
          <FannedPhone key={phone.label} phone={phone} opened={opened} />
        ))}
      </div>
    </section>
  );
};

PhoneFan.displayName = 'PhoneFan';

export { PhoneFan };
