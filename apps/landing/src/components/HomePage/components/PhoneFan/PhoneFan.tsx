import { useRef, useState } from 'react';
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotionConfig,
  useScroll,
  useTransform,
} from 'motion/react';
import { Doodle } from '@ValenceUI/Doodle';
import { FannedPhone } from './components/FannedPhone/FannedPhone';

const OPEN_ENOUGH = 0.97;

const PHONES = [
  { label: 'Music home', turn: -16, lift: 70, spread: -2, finish: 'blue' },
  { label: 'An album', turn: -8, lift: 26, spread: -1, finish: 'silver' },
  { label: 'Now playing', turn: 0, lift: 0, spread: 0, finish: 'blue' },
  { label: 'Your library', turn: 8, lift: 26, spread: 1, finish: 'silver' },
  { label: 'A book', turn: 16, lift: 70, spread: 2, finish: 'blue' },
] as const;

/**
 * The phone app, as a hand of cards: five phones fanned out from the one in the middle, each showing
 * a different part of it, over the words for where Valence goes drawn as an outline behind them. They
 * open out from a stack as the section scrolls into view, and once they are fully open a note is
 * written beside them with an arrow drawn down to the nearest; whoever asked for stillness sees them
 * open, note and all.
 */
const PhoneFan = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const isStill = useReducedMotionConfig() === true;
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });
  const opened = useTransform(scrollYProgress, [0.15, 0.85], isStill ? [1, 1] : [0, 1]);
  const [isFanned, setIsFanned] = useState(isStill);

  const isOnScreen = useInView(stageRef, { amount: 0.6 });

  useMotionValueEvent(opened, 'change', (value) => {
    if (isOnScreen && value >= OPEN_ENOUGH) {
      setIsFanned(true);
    }
  });

  return (
    <section aria-label="Valence on a phone" className="relative overflow-hidden py-28">
      <p
        aria-hidden
        className="valence-outline-text pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center text-[11vw] font-bold uppercase leading-none tracking-[-0.03em] text-text/20"
      >
        Every screen
      </p>

      <div className="relative mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 px-5 text-center">
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
        className="relative mx-auto flex h-[30rem] max-w-6xl items-start justify-center sm:h-[36rem]"
      >
        {PHONES.map((phone) => (
          <FannedPhone key={phone.label} phone={phone} opened={opened} />
        ))}

        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 right-0 hidden w-52 lg:block xl:-right-6"
        >
          <motion.span
            className="block rotate-6 font-hand text-2xl leading-none text-text-muted"
            initial={{ opacity: 0, y: 6 }}
            animate={isFanned ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: isStill ? 0 : 0.4 }}
          >
            the same queue, on every phone
          </motion.span>
          <Doodle
            of="arrowDown"
            delay={0.3}
            isShown={isFanned}
            className="ml-6 mt-2 h-20 w-10 -rotate-12 text-accent"
          />
        </span>
      </div>
    </section>
  );
};

PhoneFan.displayName = 'PhoneFan';

export { PhoneFan };
