import { Link, useNavigate } from '@tanstack/react-router';
import { motion, useReducedMotionConfig } from 'motion/react';
import { useRef } from 'react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { groupVariants, revealItemVariants } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';
import { useReached } from '@ValenceUI/useReached';
import { NAVIGATION } from '@ValenceDocs/content/NAVIGATION';
import type { NavSection } from '@ValenceDocs/content/DocPage.types';

const BLURBS: Readonly<Record<string, string>> = {
  start: 'What Valence is, what it needs to run, and a path from nothing to your first film.',
  install:
    'Docker Compose, the proxy in front, storage, hardware transcoding, updates and rollback.',
  use: 'Libraries, playback, accounts, requests, jobs and every setting in the admin area.',
  develop: 'Architecture, local setup, the coding standard, testing, plugins and releases.',
  plugins:
    'Write a plugin: the manifest, permissions, the host API, building blocks, themes and signing.',
  reference: 'Environment variables, ports, command line tools, the API and troubleshooting.',
};

const LISTED = 4;

type DocsHomeProps = {
  sections?: readonly NavSection[];
};

/**
 * The front page of the documentation: the blue opening card the main site's pages share, saying
 * what is covered with a way straight into the quick start and the API, then every part of it on a
 * card beneath as a numbered, ruled grid, each part with what it covers and its first few pages.
 *
 * @param sections - The parts to offer, defaulting to every section of the site.
 */
const DocsHome = ({ sections = NAVIGATION }: DocsHomeProps) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotionConfig();
  const gridRef = useRef<HTMLUListElement>(null);
  const isGridReached = useReached(gridRef, { margin: '-80px' });

  return (
    <>
      <PageHero
        eyebrow="Documentation"
        lead="Run it, use it, and"
        accent="build on it"
        description="Everything about running, using and building on Valence, the self-hosted streaming platform for the library you already own."
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              onClick={() => {
                void navigate({ to: '/$', params: { _splat: 'start/quick-start' } });
              }}
            >
              Read the quick start
            </Button>
            <Button
              variant="overlay"
              size="lg"
              onClick={() => {
                void navigate({ to: '/api' });
              }}
            >
              Browse the API
            </Button>
          </>
        }
      />

      <SectionCard>
        <section
          aria-label="Every part of the documentation"
          className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 sm:px-10 sm:py-20 xl:max-w-7xl"
        >
          <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-text lg:text-5xl">
            Start wherever you are.
          </h2>

          <div className="overflow-hidden">
            <motion.ul
              ref={gridRef}
              initial="hidden"
              animate={isGridReached ? 'shown' : 'hidden'}
              variants={groupVariants}
              className="-mb-px -mr-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {sections.map((section, index) => {
                const [first] = section.items;

                return first === undefined ? null : (
                  <motion.li
                    key={section.id}
                    custom={index}
                    variants={revealItemVariants(prefersReducedMotion)}
                    className="relative list-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-linear-to-r before:from-border/0 before:via-border before:to-border/0 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-linear-to-b after:from-border/0 after:via-border after:to-border/0"
                  >
                    <article className="flex h-full flex-col gap-4 p-7 sm:p-9">
                      <span className="text-sm font-medium tabular-nums text-accent">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <h3 className="text-2xl font-semibold tracking-[-0.02em] text-text">
                        <Link to={first.path} className="hover:text-accent">
                          {section.title}
                        </Link>
                      </h3>
                      <p className="text-[0.9375rem] leading-relaxed text-text-muted">
                        {BLURBS[section.id] ?? ''}
                      </p>
                      <ul className="mt-auto flex flex-col gap-1.5 pt-2">
                        {section.items.slice(0, LISTED).map((item) => (
                          <li key={item.path}>
                            <Link
                              to={item.path}
                              className="group inline-flex items-center gap-1.5 text-sm text-text hover:text-accent"
                            >
                              <span className="inline-flex text-text-muted transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5 group-hover:text-accent">
                                <Icon of={ArrowRightIcon} size={13} />
                              </span>
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <span className="text-xs text-text-muted">
                        {section.items.length.toString()} pages
                      </span>
                    </article>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        </section>
      </SectionCard>
    </>
  );
};

DocsHome.displayName = 'DocsHome';

export type { DocsHomeProps };

export { DocsHome };
