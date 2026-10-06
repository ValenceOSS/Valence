import { useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { IconArrowRight } from '@tabler/icons-react';
import { useReached } from '@ValenceUI/useReached';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { LIT_TEXT } from '@ValenceUI/tokens/LIT_TEXT';
import { ValenceRun } from '@ValenceLanding/components/ValenceRun/ValenceRun';
import { DEMO_URL } from '@ValenceLanding/content/DEMO_URL';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';

const STARTS = [
  0, 3.4, 1.1, 4.7, 2.2, 0.6, 3.9, 1.8, 5.1, 2.9, 0.2, 4.2, 1.5, 3.1, 0.9, 4.9,
] as const;

const ROWS = Array.from(
  { length: 32 },
  (_, at) => ((STARTS[at % STARTS.length] ?? 0) + Math.floor(at / STARTS.length) * 2.7) % 5.6,
);

/**
 * The last word on a page: a blue card the width of the page's opening one asking whether the
 * reader is ready, with the way to install it and the way to look round the demo first, beside
 * rows of Valence's name in white running diagonally to fill the rest of it, blurred where they
 * pass behind the words.
 */
const GetStarted = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const cardRef = useRef<HTMLDivElement>(null);
  const isCardReached = useReached(cardRef, { margin: '-80px' });

  return (
    <section
      id="download"
      aria-label="Get started"
      className="scroll-mt-24 px-2 pt-2 sm:px-3 sm:pt-3"
    >
      <motion.div
        ref={cardRef}
        initial="hidden"
        animate={isCardReached ? 'shown' : 'hidden'}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'bouncy')}
        className="relative isolate overflow-hidden rounded-[2rem] bg-accent text-accent-contrast sm:rounded-[2.5rem]"
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-[calc(50%-2rem)] right-0 hidden overflow-hidden lg:block"
        >
          <div className="absolute left-1/2 top-1/2 flex w-max -translate-x-1/2 -translate-y-1/2 -rotate-[38deg] flex-col gap-4">
            {ROWS.map((startsAt, at) => (
              <div key={at} className="overflow-hidden text-5xl text-accent-contrast">
                <ValenceRun isBackwards={at % 2 === 1} startsAt={startsAt} repeats={20} />
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="absolute inset-y-0 left-[calc(50%-7rem)] hidden w-[12rem] bg-accent/20 backdrop-blur-xl [mask-image:linear-gradient(to_right,transparent,black_35%,black_65%,transparent)] lg:block"
        />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 sm:px-10 sm:py-28 xl:max-w-7xl">
          <div className="flex flex-col items-start gap-8">
            <h2 className="max-w-[12ch] text-balance text-[clamp(3rem,8vw,7rem)] font-bold leading-[0.92] tracking-[-0.045em]">
              <span className={cn('box-decoration-clone', LIT_TEXT)}>Ready to get started?</span>
            </h2>
            <p className="max-w-lg text-balance text-lg text-accent-contrast/85 sm:text-xl">
              Valence is free and open source. Put it on your own server in a few minutes, or look
              round the demo first.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="confirm"
                size="xl"
                onClick={() => {
                  window.location.assign(`${DOCS_URL}/start/quick-start`);
                }}
              >
                Install Valence
                <IconArrowRight size={18} />
              </Button>
              <Button
                variant="overlay"
                size="xl"
                onClick={() => {
                  window.location.assign(DEMO_URL);
                }}
              >
                Try the demo
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

GetStarted.displayName = 'GetStarted';

export { GetStarted };
