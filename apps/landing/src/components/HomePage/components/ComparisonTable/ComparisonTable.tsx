import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { COMPARISON_ROWS } from '@ValenceLanding/content/comparison';

const CELL = 'px-4 py-3 text-sm';

const HEAD_CELL = `${CELL} text-left font-semibold text-text`;

/**
 * How Valence compares to Plex and Jellyfin, row by row, so nothing said about them here is a claim
 * somebody can't check for themselves.
 */
const ComparisonTable = () => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <section
      aria-label="How it compares"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-10 xl:max-w-7xl"
    >
      <motion.div
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
        className="flex flex-col gap-2"
      >
        <h2 className="text-3xl font-semibold tracking-tight text-text lg:text-4xl">
          How it compares
        </h2>
        <p className="max-w-2xl text-text-muted">
          As we understand Plex and Jellyfin today. Both move, so tell us if something's changed.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
        className="mt-8 overflow-x-auto rounded-2xl border border-border/60"
      >
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-surface-raised">
              <th scope="col" className={HEAD_CELL}>
                &nbsp;
              </th>
              <th scope="col" className={HEAD_CELL}>
                Plex
              </th>
              <th scope="col" className={HEAD_CELL}>
                Jellyfin
              </th>
              <th scope="col" className={HEAD_CELL}>
                Valence
              </th>
            </tr>
          </thead>

          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border/60 last:border-0">
                <th scope="row" className={`${HEAD_CELL} font-medium`}>
                  {row.label}
                </th>
                <td className={`${CELL} text-text-muted`}>{row.plex}</td>
                <td className={`${CELL} text-text-muted`}>{row.jellyfin}</td>
                <td className={`${CELL} font-medium text-text`}>{row.valence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  );
};

ComparisonTable.displayName = 'ComparisonTable';

export { ComparisonTable };
