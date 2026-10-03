import { motion, useReducedMotionConfig } from 'motion/react';
import { Icon } from '@ValenceUI/Icon';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import type { ProblemCardProps } from './ProblemCard.types';

/**
 * A page that could not be shown, said in the middle of the screen as one card: what went wrong in
 * a line, why in a sentence, what the page itself said where it said anything, and the ways on from
 * here. Every way a page can fail is drawn the same, so a missing page and a broken one read as two
 * of a kind.
 *
 * @param icon - A mark for the kind of problem.
 * @param headline - What went wrong, in a few words.
 * @param reason - Why, and what can be done about it.
 * @param said - What the page itself reported, shown as it was said, where it said anything.
 * @param actions - The ways on from here.
 */
const ProblemCard = ({ icon, headline, reason, said, actions }: ProblemCardProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <main
      role="alert"
      className="flex min-h-[calc(100dvh-var(--valence-window-bar))] items-center justify-center px-5 py-10"
    >
      <motion.div
        variants={revealVariants(prefersReducedMotion)}
        initial="hidden"
        animate="shown"
        transition={revealTransition(prefersReducedMotion)}
        className="valence-card-shell flex w-full max-w-md flex-col"
      >
        <div className="valence-card-face flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-[var(--surface-hover)] text-text">
            <Icon of={icon} size={22} />
          </span>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-text">{headline}</h1>
            <p className="font-body text-sm leading-relaxed text-text-muted">{reason}</p>
          </div>

          {said === undefined || said === null || said === '' ? null : (
            <pre className="w-full max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--surface-line)] bg-[var(--surface-hover)] px-3 py-2.5 text-left font-mono text-xs leading-relaxed text-text-muted">
              {said}
            </pre>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 px-3 py-3 sm:flex-row sm:justify-center">
          {actions}
        </div>
      </motion.div>
    </main>
  );
};

ProblemCard.displayName = 'ProblemCard';

export { ProblemCard };
