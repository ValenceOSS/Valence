import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Drawer } from '@ValenceUI/Drawer';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { UiComponentView } from '@ValenceLanding/components/UiLibraryPage/components/UiComponentView/UiComponentView';
import { PageHero } from '@ValenceLanding/components/PageHero/PageHero';
import { SectionCard } from '@ValenceLanding/components/SectionCard/SectionCard';
import { GITHUB_URL } from '@ValenceLanding/content/GITHUB_URL';
import { UiLibrarySidebar } from '@ValenceLanding/components/UiLibraryPage/components/UiLibrarySidebar/UiLibrarySidebar';
import { UI_EXAMPLE_GROUPS } from '@ValenceLanding/components/UiLibraryPage/examples/UI_EXAMPLE_GROUPS';
import { groupComponents } from '@ValenceLanding/components/UiLibraryPage/groupComponents';
import catalogue from 'virtual:ui-catalogue';

const UI_PATH = /^\/ui\/?(?<slug>[^/]*)/u;

/**
 * The UI library: an opening card saying what @ValenceUI is — the component package every Valence
 * app is built from, written for Valence itself — then on a card beneath it every component listed
 * down the side by group in a panel of its own with a search field, and for the one chosen its
 * examples drawn live with the props it takes read straight from its source. On a phone the list
 * moves into a drawer behind a button. Without a component chosen, the groups are laid out as cards
 * to start from instead.
 */
const UiLibraryPage = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const prefersReducedMotion = useReducedMotionConfig();
  const [query, setQuery] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);
  const slug = (UI_PATH.exec(pathname)?.groups?.slug ?? '').toLowerCase();
  const doc = catalogue.find((one) => one.name.toLowerCase() === slug) ?? null;
  const everything = groupComponents(catalogue, UI_EXAMPLE_GROUPS);
  const listed = groupComponents(catalogue, UI_EXAMPLE_GROUPS, query);
  const group = everything.find((one) => one.components.some((each) => each.name === doc?.name));
  const examples =
    doc === null
      ? []
      : (UI_EXAMPLE_GROUPS.find((one) => Object.hasOwn(one.examples, doc.name))?.examples[
          doc.name
        ] ?? []);

  const sidebar = (onChoose?: () => void) => (
    <UiLibrarySidebar
      groups={listed}
      selected={doc?.name ?? null}
      query={query}
      onQueryChange={setQuery}
      {...(onChoose === undefined ? {} : { onChoose })}
    />
  );

  return (
    <>
      <PageHero
        eyebrow="@ValenceUI"
        lead="The parts every Valence app is"
        accent="built from"
        description={
          <>
            ValenceUI is our own component package, written for Valence and used by every one of its
            apps: Radix underneath, styled with Tailwind, moving with Motion. Each component here is
            drawn live, with the props it takes read straight from its source.
          </>
        }
        actions={
          <Button
            variant="overlay"
            size="lg"
            onClick={() => {
              window.location.assign(`${GITHUB_URL}/tree/main/packages/ui`);
            }}
          >
            Read the source
          </Button>
        }
      />

      <SectionCard>
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="sticky top-24 hidden max-h-[calc(100svh-7rem)] self-start overflow-y-auto rounded-2xl border border-border/60 bg-surface-raised p-3 lg:block">
            {sidebar()}
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="lg:hidden">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsListOpen(true);
                }}
              >
                All components
              </Button>

              <Drawer
                label="Components"
                isOpen={isListOpen}
                onClose={() => {
                  setIsListOpen(false);
                }}
              >
                <div className="p-4">
                  {sidebar(() => {
                    setIsListOpen(false);
                  })}
                </div>
              </Drawer>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={doc?.name ?? slug}
                variants={revealVariants(prefersReducedMotion)}
                initial="hidden"
                animate="shown"
                exit="gone"
                transition={revealTransition(prefersReducedMotion, 'bouncy')}
              >
                {doc === null ? (
                  <section aria-labelledby="ui-library-title" className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h2
                        id="ui-library-title"
                        className="text-3xl font-semibold tracking-tight text-text"
                      >
                        {slug === ''
                          ? 'Start from a group'
                          : `There is no component called ${slug}`}
                      </h2>
                      <p className="text-text-muted">
                        {catalogue.length.toString()} components in {everything.length.toString()}{' '}
                        groups.
                      </p>
                    </div>
                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {everything.map((each) => (
                        <li key={each.name}>
                          <Link
                            to="/ui/$component"
                            resetScroll={false}
                            params={{ component: (each.components[0]?.name ?? '').toLowerCase() }}
                            className="flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-surface-raised p-5 transition-colors hover:border-accent/50"
                          >
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="text-lg font-semibold text-text">{each.name}</span>
                              <span className="text-sm tabular-nums text-text-muted">
                                {each.components.length.toString()}
                              </span>
                            </span>
                            <span className="text-sm leading-relaxed text-text-muted">
                              {each.components
                                .slice(0, 5)
                                .map((one) => one.name)
                                .join(', ')}
                              {each.components.length > 5 ? ' and more' : ''}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <UiComponentView doc={doc} group={group?.name ?? ''} examples={examples} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </SectionCard>
    </>
  );
};

UiLibraryPage.displayName = 'UiLibraryPage';

export { UiLibraryPage };
