import { motion, useReducedMotionConfig } from 'motion/react';
import { IconArrowRight } from '@tabler/icons-react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { ValenceRun } from '@ValenceLanding/components/ValenceRun/ValenceRun';
import { DEMO_URL } from '@ValenceLanding/content/DEMO_URL';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';

const STRIPS = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * The last word on the home page: a blue card the width of the hero asking whether the reader is
 * ready, with the way to install it and the way to look round the demo first, beside strips of
 * Valence's name running diagonally across it, blurred where they pass behind the words.
 */
const GetStarted = () => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <section
      id="download"
      aria-label="Get started"
      className="scroll-mt-24 px-2 pt-2 sm:px-3 sm:pt-3"
    >
      <motion.div
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'bouncy')}
        className="relative isolate overflow-hidden rounded-[2rem] bg-accent text-accent-contrast sm:rounded-[2.5rem]"
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-[46%] right-0 hidden overflow-hidden lg:block"
        >
          <div className="absolute left-[-10%] top-1/2 flex w-[160%] -translate-y-1/2 -rotate-[38deg] flex-col gap-3">
            {STRIPS.map((at) => (
              <div key={at} className="overflow-hidden bg-accent-contrast py-3 text-accent">
                <ValenceRun isBackwards={at % 2 === 1} className="text-5xl" />
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="absolute inset-y-0 left-[40%] hidden w-[16%] bg-accent/20 backdrop-blur-xl [mask-image:linear-gradient(to_right,transparent,black_35%,black_65%,transparent)] lg:block"
        />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 sm:px-10 sm:py-28 xl:max-w-7xl">
          <div className="flex flex-col items-start gap-8">
            <h2 className="max-w-[12ch] text-balance text-[clamp(3rem,8vw,7rem)] font-bold leading-[0.92] tracking-[-0.045em]">
              Ready to get started?
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
