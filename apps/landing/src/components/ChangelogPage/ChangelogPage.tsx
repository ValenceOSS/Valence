import { motion } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { ChangelogSummary } from '@ValenceLanding/components/ChangelogPage/components/ChangelogSummary/ChangelogSummary';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';

/**
 * Every release Valence has shipped, newest first, each written up by hand and leading to a page of
 * its own.
 */
const ChangelogPage = () => (
  <div className="mx-auto max-w-5xl px-5 pb-24 pt-32 sm:px-10">
    <header className="flex flex-col gap-3 pb-6">
      <h1 className="text-5xl font-semibold tracking-tight text-text sm:text-6xl">Changelog</h1>
      <p className="max-w-xl text-lg text-text-muted">
        New things in Valence, and what got better, written up as they ship.
      </p>
    </header>

    <motion.ul initial="hidden" animate="shown" variants={groupVariants}>
      {CHANGELOG.map((entry, index) => (
        <ChangelogSummary key={entry.slug} entry={entry} index={index} />
      ))}
    </motion.ul>
  </div>
);

ChangelogPage.displayName = 'ChangelogPage';

export { ChangelogPage };
