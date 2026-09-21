import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { Reveal } from '@ValenceUI/Reveal';
import { RevealItem } from '@ValenceUI/RevealItem';
import { Logo } from '@ValenceUI/Logo';
import { Card } from '@ValenceUI/Card';
import { NAVIGATION } from '@ValenceDocs/content/NAVIGATION';
import type { NavSection } from '@ValenceDocs/content/DocPage.types';

const BLURBS: Readonly<Record<string, string>> = {
  start: 'What Valence is, what it needs to run, and a path from nothing to your first film.',
  install:
    'Docker Compose, the proxy in front, storage, hardware transcoding, updates and rollback.',
  use: 'Libraries, playback, accounts, requests, jobs and every setting in the admin area.',
  develop: 'Architecture, local setup, the coding standard, testing, plugins and releases.',
  reference: 'Environment variables, ports, command line tools, the API and troubleshooting.',
};

type DocsHomeProps = {
  sections?: readonly NavSection[];
};

/**
 * The front page of the documentation: what it covers, and a way into each part of it.
 *
 * @param sections - The parts to offer, defaulting to every section of the site.
 */
const DocsHome = ({ sections = NAVIGATION }: DocsHomeProps) => (
  <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16 lg:px-12">
    <header className="flex flex-col gap-5">
      <Reveal>
        <Logo size={48} isSolid />
      </Reveal>

      <Reveal delay={0.06}>
        <h1 className="text-5xl font-bold tracking-tight text-text">Valence documentation</h1>
      </Reveal>

      <Reveal delay={0.12}>
        <p className="max-w-2xl text-lg leading-8 text-text-muted">
          Everything about running, using and building on Valence, the self-hosted streaming
          platform for the library you already own.
        </p>
      </Reveal>
    </header>

    <motion.ul
      initial="hidden"
      animate="shown"
      variants={groupVariants}
      className="grid gap-4 sm:grid-cols-2"
    >
      {sections.map((section, index) => {
        const [first] = section.items;

        return first === undefined ? null : (
          <RevealItem key={section.id} index={index + 3} className="list-none">
            <Link to={first.path} className="block h-full">
              <Card isInteractive padding="lg" className="flex h-full flex-col gap-2">
                <span className="text-lg font-semibold text-text">{section.title}</span>
                <span className="text-sm leading-6 text-text-muted">
                  {BLURBS[section.id] ?? ''}
                </span>
                <span className="mt-2 text-xs text-text-muted">
                  {section.items.length.toString()} pages
                </span>
              </Card>
            </Link>
          </RevealItem>
        );
      })}
    </motion.ul>
  </div>
);

DocsHome.displayName = 'DocsHome';

export type { DocsHomeProps };

export { DocsHome };
