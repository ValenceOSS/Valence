import { useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { useReached } from '@ValenceUI/useReached';

/**
 * A statement about whose library it is, set large: the first sentence in the full text colour and
 * the rest quieter, rising gently into place once it is scrolled to.
 */
const Statement = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const statementRef = useRef<HTMLParagraphElement>(null);
  const isReached = useReached(statementRef, { margin: '-80px' });

  return (
    <section aria-label="On your data" className="mx-auto max-w-7xl px-5 py-16 sm:px-10 sm:py-24">
      <motion.p
        ref={statementRef}
        initial="hidden"
        animate={isReached ? 'shown' : 'hidden'}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
        className="max-w-[68.75rem] text-pretty text-[clamp(1.75rem,3.5vw,3rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-text-muted"
      >
        <span className="text-text">Your library stays yours.</span> Films, shows, music and books,
        on a server you run, shared with the people you choose, and nobody else&rsquo;s server in
        the way.
      </motion.p>
    </section>
  );
};

Statement.displayName = 'Statement';

export { Statement };
