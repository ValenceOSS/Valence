import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Drawer } from '@ValenceUI/Drawer';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { UiComponentView } from '@ValenceLanding/components/UiLibraryPage/components/UiComponentView/UiComponentView';
import { SectionCard } from '@ValenceLanding/components/SectionCard/SectionCard';
import { UiLibrarySidebar } from '@ValenceLanding/components/UiLibraryPage/components/UiLibrarySidebar/UiLibrarySidebar';
import { UI_EXAMPLE_GROUPS } from '@ValenceLanding/components/UiLibraryPage/examples/UI_EXAMPLE_GROUPS';
import { groupComponents } from '@ValenceLanding/components/UiLibraryPage/groupComponents';
import catalogue from 'virtual:ui-catalogue';

const UI_PATH = /^\/ui\/?(?<slug>[^/]*)/u;

/**
 * The UI library: every ValenceUI component, listed down the side by group, and for the one chosen
 * its examples drawn live, with the props it takes read straight from its source.
 * On a phone the list moves into a drawer behind a button. Without a component chosen the page
 * introduces itself and lists the groups instead. It all sits on one card, like the other pages'
 * parts.
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
    <SectionCard>
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-24 pt-28 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="sticky top-24 hidden max-h-[calc(100svh-7rem)] overflow-y-auto pb-8 lg:block">
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
                <section
                  aria-labelledby="ui-library-title"
                  className="flex max-w-2xl flex-col gap-6"
                >
                  <h1
                    id="ui-library-title"
                    className="text-4xl font-semibold tracking-tight text-text"
                  >
                    {slug === '' ? 'UI library' : `There is no component called ${slug}`}
                  </h1>
                  <p className="text-base leading-relaxed text-text-muted">
                    Every part Valence's apps are built from, drawn live, with the props each takes
                    read straight from its source. {catalogue.length.toString()} components in{' '}
                    {everything.length.toString()} groups.
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {everything.map((each) => (
                      <li key={each.name}>
                        <Link
                          to="/ui/$component"
                          params={{ component: (each.components[0]?.name ?? '').toLowerCase() }}
                          className="valence-surface inline-flex rounded-xl px-4 py-2 text-sm font-medium text-text"
                        >
                          {each.name}
                          <span className="ml-2 text-text-muted">
                            {each.components.length.toString()}
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
  );
};

UiLibraryPage.displayName = 'UiLibraryPage';

export { UiLibraryPage };
