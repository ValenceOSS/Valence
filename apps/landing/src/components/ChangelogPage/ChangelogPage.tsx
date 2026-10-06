import { motion } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { ChangelogSummary } from '@ValenceLanding/components/ChangelogPage/components/ChangelogSummary/ChangelogSummary';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';
import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';

/**
 * Every release Valence has shipped, newest first, each written up by hand and leading to a page of
 * its own, on a card beneath the page's opening one and above the way to get started.
 */
const ChangelogPage = () => (
  <>
    <PageHero
      eyebrow="Changelog"
      lead="What is"
      accent="new"
      trail="in Valence"
      description="New things in Valence, and what got better, written up as they ship."
    />

    <SectionCard>
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-10 sm:py-16">
        <motion.ul initial="hidden" animate="shown" variants={groupVariants}>
          {CHANGELOG.map((entry, index) => (
            <ChangelogSummary key={entry.slug} entry={entry} index={index} />
          ))}
        </motion.ul>
      </div>
    </SectionCard>

    <GetStarted />
  </>
);

ChangelogPage.displayName = 'ChangelogPage';

export { ChangelogPage };
