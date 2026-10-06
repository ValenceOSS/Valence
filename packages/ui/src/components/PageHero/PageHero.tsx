import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { Doodle } from '@ValenceUI/Doodle';
import { cn } from '@ValenceUI/cn';
import { AuroraBackdrop } from '@ValenceUI/AuroraBackdrop';
import { LIT_TEXT } from '@ValenceUI/tokens/LIT_TEXT';
import type { PageHeroProps } from './PageHero.types';

/**
 * The card every page but the home page opens on: the same slow blue light as the home page's,
 * shorter, with a small line above the page's name, the name itself lit from below with the words
 * that matter most written softer and underlined by hand, a line or two about the page, and room
 * for what to do next and a picture beside it all. Its parts arrive one after another.
 *
 * @param eyebrow - The small line above the name.
 * @param lead - The name, or the part of it before the words that matter most.
 * @param accent - The words that matter most, written softer and underlined.
 * @param trail - The part of the name after them.
 * @param description - A line or two about the page.
 * @param actions - What to do next, set under the words.
 * @param aside - A picture set beside the words on a wide screen.
 */
const PageHero = ({ eyebrow, lead, accent, trail, description, actions, aside }: PageHeroProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const arrives = {
    variants: revealVariants(prefersReducedMotion),
    transition: revealTransition(prefersReducedMotion, 'bouncy'),
  };

  return (
    <section className="px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-aurora sm:rounded-[2.5rem]">
        <AuroraBackdrop />

        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className={cn(
            'mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-32 sm:px-10 sm:pb-20 sm:pt-40 xl:max-w-7xl',
            aside === undefined ? '' : 'lg:grid-cols-[1.1fr_1fr]',
          )}
        >
          <div className="flex flex-col items-start gap-5">
            {eyebrow === undefined ? null : (
              <motion.p
                {...arrives}
                className="font-mono text-xs uppercase tracking-[0.2em] text-on-scrim/75"
              >
                {eyebrow}
              </motion.p>
            )}

            <motion.h1
              {...arrives}
              className="max-w-[18ch] text-balance text-[clamp(2.75rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-on-scrim"
            >
              <span className={cn('box-decoration-clone', LIT_TEXT)}>{lead}</span>
              {accent === undefined ? null : (
                <>
                  {' '}
                  <span className="relative inline-block font-accent font-normal italic tracking-normal">
                    <span className={LIT_TEXT}>{accent}</span>
                    <Doodle
                      of="underline"
                      delay={0.5}
                      className="absolute -bottom-[0.12em] left-[2%] h-[0.22em] w-[96%] text-accent"
                    />
                  </span>
                </>
              )}
              {trail === undefined ? null : (
                <>
                  {' '}
                  <span className={cn('box-decoration-clone', LIT_TEXT)}>{trail}</span>
                </>
              )}
            </motion.h1>

            {description === undefined ? null : (
              <motion.div
                {...arrives}
                className="max-w-xl text-balance text-lg text-on-scrim/75 sm:text-xl"
              >
                {description}
              </motion.div>
            )}

            {actions === undefined ? null : (
              <motion.div {...arrives} className="flex flex-wrap gap-3 pt-3">
                {actions}
              </motion.div>
            )}
          </div>

          {aside === undefined ? null : (
            <motion.div {...arrives} className="hidden lg:block">
              {aside}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

PageHero.displayName = 'PageHero';

export { PageHero };
