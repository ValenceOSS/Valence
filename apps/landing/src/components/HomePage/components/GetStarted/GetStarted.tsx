import { motion, useReducedMotionConfig } from 'motion/react';
import { IconArrowRight } from '@tabler/icons-react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { Logo } from '@ValenceUI/Logo';
import { DEMO_URL } from '@ValenceLanding/content/DEMO_URL';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';

/**
 * The last word on the home page: a blue card the width of the hero asking whether the reader is
 * ready, with the way to install it and the way to look round the demo first, beside Valence's
 * mark drawn in outline and laid back isometrically.
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
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1fr_auto] xl:max-w-7xl">
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

          <div
            aria-hidden
            className="hidden justify-self-end opacity-80 [perspective:1600px] lg:block"
          >
            <Logo
              size={220}
              isSolid
              src="/valence-logo-outline.svg"
              className="[transform:rotateX(55deg)_rotateZ(-45deg)]"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

GetStarted.displayName = 'GetStarted';

export { GetStarted };
