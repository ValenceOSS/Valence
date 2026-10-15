import { ObservabilitySearchSchema } from '@ValenceClient/admin/ObservabilitySearchSchema';
import { mergeObservabilitySearch } from '@ValenceClient/admin/mergeObservabilitySearch';
import { readObservabilityView } from '@ValenceScreens/components/ObservabilityPage/readObservabilityView';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { fadeVariants, stillTransition } from '@ValenceUI/animations/reveal';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Sidebar } from '@ValenceUI/Sidebar';
import { SidebarToggle } from '@ValenceUI/SidebarToggle';
import { Spinner } from '@ValenceUI/Spinner';
import { Tabs } from '@ValenceUI/Tabs';
import { ADMIN_PAGE_ACTIONS } from '@ValenceScreens/components/AdminPage/ADMIN_PAGE_ACTIONS';
import { cn } from '@ValenceUI/cn';
import { useMatchesMedia } from '@ValenceUI/useMatchesMedia';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { AdminArea } from '@ValenceScreens/components/AdminArea/AdminArea';
import { visibleAdminSections } from '@ValenceScreens/components/AdminArea/visibleAdminSections';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { describeAcceleration } from '@ValenceScreens/components/AdminArea/describeAcceleration';
import { describeFfmpeg } from '@ValenceScreens/components/AdminArea/describeFfmpeg';
import {
  readSidebarCollapsed,
  saveSidebarCollapsed,
} from '@ValenceScreens/navigation/sidebarCollapsePreference';
import {
  readSidebarFolds,
  saveSidebarFolds,
} from '@ValenceScreens/navigation/sidebarFoldPreference';
import { say } from '@ValenceI18n/say';
import { useWindowBarOnTheFrame } from '@ValenceScreens/desktop/useWindowBarOnTheFrame';
import { BrandMark } from '@ValenceScreens/components/BrandMark/BrandMark';
import { setAdminSidebarControl } from '@ValenceScreens/desktop/adminSidebarControl';
import { isTheDesktopClient } from '@ValenceScreens/desktop/theDesktopShell';
import { AdminSearch } from './components/AdminSearch/AdminSearch';

const MARKS_PLACE = 'valence-admin-mark';

const ROOM_FOR_THE_SIDEBAR = '(min-width: 48rem)';
/**
 * The server, as a page of its own rather than something raised over whatever was on screen. Eleven
 * sections is not a row of tabs any more — it is a sidebar, foldable the way any of them are, with
 * every section a real address that can be linked to, refreshed on, and left with the back button.
 *
 * On a phone the sidebar is a drawer instead: closed until the button in the bar across the top opens
 * it, sliding in over the page, and closing again once a section is chosen, the page beside it is
 * tapped or Escape is pressed. Whether it is open there is never remembered, so the page always
 * opens at its full width.
 *
 * Gated on being told no, not on not yet being told: while the permission answer is still on its
 * way every question reads as "no", and leaving on that basis would throw an administrator back out
 * on every page load.
 */
const AdminPage = () => {
  useWindowBarOnTheFrame();
  const go = useNavigate();
  const { panel } = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const { job, folder, tab, title } = search;
  const { mayAdminister, isLoading } = useWhatIMayDo();
  const observability = ObservabilitySearchSchema.parse(search);
  const view = readObservabilityView(observability.view, panel);
  const [isCollapsed, setIsCollapsed] = useState(readSidebarCollapsed);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [folds, setFolds] = useState(readSidebarFolds);
  const hasRoomForTheSidebar = useMatchesMedia(ROOM_FOR_THE_SIDEBAR);
  const isClosed = hasRoomForTheSidebar ? isCollapsed : !isDrawerOpen;
  const isFolded = hasRoomForTheSidebar && isCollapsed;

  const requesting = useQuery(requestsQueries.availability());
  const sections = visibleAdminSections(requesting.data?.isEnabled ?? false);
  const items = sections.flatMap((section) => section.items);
  const showing =
    items.find((one) => one.id === (panel === 'logs' ? 'jobs' : panel))?.id ?? 'overview';
  const showingName = items.find((one) => one.id === showing)?.label ?? '';
  const showingGroup =
    sections.find((section) => section.items.some((one) => one.id === showing))?.label ?? null;

  const setClosed = (next: boolean) => {
    if (hasRoomForTheSidebar) {
      setIsCollapsed(next);
      saveSidebarCollapsed(next);
    } else {
      setIsDrawerOpen(!next);
    }
  };

  const asked = useQuery(adminQueries.overview());
  const overview = asked.data ?? null;
  const build = useQuery(sessionQueries.version());
  const version = build.data ?? null;

  const acceleration =
    overview === null
      ? null
      : describeAcceleration(overview.settings.hardwareAccel, overview.transcoder.hardwareAccels);

  const ffmpeg = describeFfmpeg(overview?.transcoder.ffmpegVersion ?? null);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [showing, hasRoomForTheSidebar]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isLoading && !mayAdminister) {
      void go({ to: '/', replace: true });
    }
  }, [isLoading, mayAdminister, go]);

  useEffect(() => {
    if (isLoading || !mayAdminister) {
      setAdminSidebarControl(null);

      return () => {
        setAdminSidebarControl(null);
      };
    }

    setAdminSidebarControl({
      isOpen: !isClosed,
      label: isClosed ? say('common.openTheSidebar') : say('common.closeTheSidebar'),
      onToggle: () => {
        if (hasRoomForTheSidebar) {
          setIsCollapsed(!isClosed);
          saveSidebarCollapsed(!isClosed);
        } else {
          setIsDrawerOpen(isClosed);
        }
      },
    });

    return () => {
      setAdminSidebarControl(null);
    };
  }, [hasRoomForTheSidebar, isClosed, isLoading, mayAdminister]);

  if (isLoading || !mayAdminister) {
    return (
      <div className="mt-[var(--valence-window-bar)] flex h-[calc(100dvh-var(--valence-window-bar))] items-center justify-center">
        <Spinner size="lg" label={say('screens.adminPage.readingWhatYouMayDo')} />
      </div>
    );
  }

  return (
    <Tabs
      value={showing}
      onValueChange={(next) => {
        void go({ to: '/admin/$panel', params: { panel: next } });
      }}
    >
      <div className="relative mt-[var(--valence-window-bar)] flex min-h-[calc(100dvh-var(--valence-window-bar))] bg-[var(--frame-back)]">
        <AnimatePresence>
          {hasRoomForTheSidebar || !isDrawerOpen ? null : (
            <motion.div
              key="scrim"
              variants={fadeVariants}
              initial="hidden"
              animate="shown"
              exit="gone"
              transition={stillTransition}
              className="fixed inset-x-0 bottom-0 top-[var(--valence-window-bar)] z-30"
            >
              <Button
                variant="bare"
                size="none"
                label={say('common.closeTheSidebar')}
                onClick={() => {
                  setIsDrawerOpen(false);
                }}
                className="block size-full bg-scrim"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          inert={!hasRoomForTheSidebar && !isDrawerOpen}
          className={
            hasRoomForTheSidebar
              ? 'sticky top-[var(--valence-window-bar)] h-[calc(100dvh-var(--valence-window-bar))] shrink-0 self-start'
              : cn(
                  'fixed bottom-0 left-0 top-[var(--valence-window-bar)] z-40',
                  'transition-[translate,box-shadow] duration-[var(--duration-slow)] ease-[var(--ease-out)] motion-reduce:transition-none',
                  isDrawerOpen
                    ? 'translate-x-0 shadow-[var(--shadow-lifted)]'
                    : '-translate-x-full',
                )
          }
        >
          <Sidebar
            className="bg-[var(--frame-back)]"
            label={say('common.server')}
            brand={
              <Button
                variant="bare"
                size="none"
                label={say('screens.adminPage.backToValence')}
                onClick={() => {
                  void go({ to: '/' });
                }}
                className="flex items-center"
              >
                <BrandMark hasMark marksPlace={MARKS_PLACE} size="sm" />
              </Button>
            }
            groups={sections.map((section) => ({
              id: section.id,
              isOpen:
                folds[section.id] ??
                (!section.isFoldedAtFirst || section.items.some((item) => item.id === showing)),
              ...(section.label === null ? {} : { label: section.label }),
              items: section.items.map((item) => ({ ...item, href: `/admin/${item.id}` })),
            }))}
            onGroupOpenChange={(id, isOpen) => {
              const next = { ...folds, [id]: isOpen };

              setFolds(next);
              saveSidebarFolds(next);
            }}
            value={showing}
            onSelect={(next) => {
              void go({ to: '/admin/$panel', params: { panel: next } });
            }}
            lead={
              <AdminSearch
                sections={sections}
                isCompact={isClosed}
                onGo={(next) => {
                  void go({ to: '/admin/$panel', params: { panel: next } });
                }}
              />
            }
            {...(isTheDesktopClient()
              ? {}
              : {
                  onCollapsedChange: setClosed,
                })}
            isCollapsed={isFolded}
            collapsedVariant="hidden"
          />
        </div>

        <div
          inert={!hasRoomForTheSidebar && isDrawerOpen}
          className={cn(
            'flex min-w-0 flex-1 flex-col overflow-clip border-[var(--surface-line)] bg-[var(--frame-panel)] [--card-shell:var(--frame-card)]',
            'md:my-2 md:mr-2 md:rounded-2xl md:border md:shadow-[var(--shadow-raised)]',
            isCollapsed ? 'md:ml-2' : '',
          )}
        >
          <div className="sticky top-[var(--valence-window-bar)] z-20 flex min-h-14 items-center gap-3 border-b border-[var(--surface-line)] bg-[var(--frame-panel)] px-4 py-2.5 lg:px-5">
            {hasRoomForTheSidebar || isTheDesktopClient() ? null : (
              <SidebarToggle
                isOpen={false}
                label={say('common.openTheSidebar')}
                onToggle={() => {
                  setIsDrawerOpen(true);
                }}
              />
            )}

            {isFolded && !isTheDesktopClient() ? (
              <SidebarToggle
                isOpen={false}
                label={say('common.openTheSidebar')}
                onToggle={() => {
                  setIsCollapsed(false);
                  saveSidebarCollapsed(false);
                }}
              />
            ) : null}

            <h1 className="flex min-w-0 flex-1 items-baseline gap-1.5 text-[0.9375rem]">
              {showingGroup === null || showingGroup === showingName ? null : (
                <span className="shrink-0 text-text-muted">{showingGroup} /</span>
              )}
              <span className="truncate font-sans font-semibold text-text">{showingName}</span>
            </h1>

            <div id={ADMIN_PAGE_ACTIONS} className="flex shrink-0 items-center gap-2" />

            {version === null ? null : (
              <span
                aria-label={say('screens.adminPage.valenceVersion', { version })}
                className="hidden shrink-0 sm:inline-flex"
              >
                <Badge size="md" tone="quiet" className="gap-1.5 font-mono uppercase tracking-wide">
                  <span aria-hidden>{say('common.valence')}</span>
                  <span aria-hidden className="size-1 rounded-full bg-current" />
                  <span aria-hidden>{version}</span>

                  {acceleration === null ? null : (
                    <>
                      <span aria-hidden className="mx-1 h-3.5 w-px bg-current opacity-40" />

                      <HoverCard
                        side="bottom"
                        align="end"
                        detail={
                          <div className="flex max-w-xs flex-col gap-2 text-xs leading-relaxed">
                            <p>{acceleration.detail}</p>

                            {ffmpeg === null ? null : (
                              <p className="font-medium text-text">{ffmpeg}</p>
                            )}
                          </div>
                        }
                      >
                        <span>{acceleration.label}</span>
                      </HoverCard>
                    </>
                  )}
                </Badge>
              </span>
            )}
          </div>

          <div className="flex-1 p-4 lg:p-5">
            <AdminArea
              panel={showing}
              onPanel={(next, search) => {
                void go({
                  to: '/admin/$panel',
                  params: { panel: next },
                  ...(search === undefined ? {} : { search }),
                });
              }}
              initialJob={job ?? null}
              observability={{ ...observability, ...(view === undefined ? {} : { view }) }}
              onObservabilityChange={(change) => {
                void go({
                  to: '/admin/$panel',
                  params: { panel: showing },
                  search: {
                    ...(job === undefined ? {} : { job }),
                    ...mergeObservabilitySearch(observability, change),
                  },
                  replace: true,
                });
              }}
              folder={folder ?? null}
              catalogue={{ tab: tab ?? 'films', title: title ?? null }}
              onCatalogue={(address) => {
                void go({
                  to: '/admin/$panel',
                  params: { panel: 'catalogue' },
                  search: {
                    tab: address.tab,
                    ...(address.title === null ? {} : { title: address.title }),
                  },
                });
              }}
              onOpenFolder={(path) => {
                void go({
                  to: '/admin/$panel',
                  params: { panel: 'files' },
                  search: { folder: path },
                });
              }}
              onJobChange={(next) => {
                void go({
                  to: '/admin/$panel',
                  params: { panel: showing },
                  search: { ...observability, ...(next === null ? {} : { job: next }) },
                });
              }}
            />
          </div>
        </div>
      </div>
    </Tabs>
  );
};

AdminPage.displayName = 'AdminPage';

export { AdminPage };
