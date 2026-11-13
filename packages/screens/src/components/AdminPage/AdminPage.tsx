import { Badge } from '@ValenceUI/Badge';
import { ObservabilitySearchSchema } from '@ValenceClient/admin/ObservabilitySearchSchema';
import { mergeObservabilitySearch } from '@ValenceClient/admin/mergeObservabilitySearch';
import { readObservabilityView } from '@ValenceScreens/components/ObservabilityPage/readObservabilityView';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { fadeVariants, stillTransition } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import {
  PanelLeft as PanelLeftIcon,
  PanelTop as PanelTopIcon,
  Pin as PinIcon,
  PinOff as PinOffIcon,
} from '@keyline-icons/react';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import {
  readAdminNavPlace,
  saveAdminNavPlace,
} from '@ValenceScreens/navigation/adminNavPlacePreference';
import { Sidebar } from '@ValenceUI/Sidebar';
import { ResizablePanel } from '@ValenceUI/ResizablePanel';
import { sidebarWidth } from '@ValenceScreens/navigation/sidebarWidth';
import { SidebarToggle } from '@ValenceUI/SidebarToggle';
import { Spinner } from '@ValenceUI/Spinner';
import { Tabs } from '@ValenceUI/Tabs';
import { ADMIN_PAGE_ACTIONS } from '@ValenceScreens/components/AdminPage/ADMIN_PAGE_ACTIONS';
import { ADMIN_NOTICES } from '@ValenceScreens/components/AdminPage/ADMIN_NOTICES';
import { cn } from '@ValenceUI/cn';
import { useMatchesMedia } from '@ValenceUI/useMatchesMedia';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { AdminArea } from '@ValenceScreens/components/AdminArea/AdminArea';
import { searchOfList } from './searchOfList';
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
import { useAdminAttention } from '@ValenceScreens/admin/useAdminAttention';
import { countsByPanel } from '@ValenceScreens/admin/countsByPanel';
import { busyPanels } from '@ValenceScreens/admin/busyPanels';
import { togglePinned } from '@ValenceScreens/admin/togglePinned';
import {
  readPinnedPanels,
  savePinnedPanels,
} from '@ValenceScreens/navigation/pinnedPanelsPreference';
import { AdminStatusFooter } from './components/AdminStatusFooter/AdminStatusFooter';
import { isTheDesktopClient } from '@ValenceScreens/desktop/theDesktopShell';
import { AdminSearch } from './components/AdminSearch/AdminSearch';
import { WaitingOnYou } from './components/WaitingOnYou/WaitingOnYou';
import { BarButtonGroup } from './components/BarButtonGroup/BarButtonGroup';

const MARKS_PLACE = 'valence-admin-mark';

const ROOM_FOR_THE_SIDEBAR = '(min-width: 48rem)';
/**
 * The server, as a page of its own rather than something raised over whatever was on screen. Eleven
 * sections is too many for a row of tabs, so it is a sidebar, foldable the way any of them are, with
 * every section a real address that can be linked to, refreshed on, and left with the back button.
 *
 * On a phone the sidebar is a drawer instead: closed until the button in the bar across the top opens
 * it, sliding in over the page, and closing again once a section is chosen, the page beside it is
 * tapped or Escape is pressed. Whether it is open there is never remembered, so the page always
 * opens at its full width.
 *
 * The sidebar is where its own sliding highlight and the brand's mark measure from. It stands still
 * while the page scrolls past it, and a notice turning up or going away above the panel makes the
 * browser scroll the page by its height to hold what is being read in place. Measured against the
 * page, that would read as the sidebar having moved, and the highlight and the mark would slide
 * back to where they already are.
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
  const {
    job,
    folder,
    tab,
    title,
    media,
    webhook,
    server,
    titleTab,
    season,
    episode,
    part,
    mediaView,
    library,
    find,
    quick,
    order,
    desc,
    filter,
  } = search;
  const { mayAdminister, isLoading } = useWhatIMayDo();
  const observability = ObservabilitySearchSchema.parse(search);
  const view = readObservabilityView(observability.view, panel);
  const [isCollapsed, setIsCollapsed] = useState(readSidebarCollapsed);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [folds, setFolds] = useState(readSidebarFolds);
  const [pinned, setPinned] = useState(readPinnedPanels);
  const [navPlace, setNavPlace] = useState(readAdminNavPlace);
  const attention = useAdminAttention();
  const counts = countsByPanel(attention);
  const askedMonitor = useQuery(adminQueries.monitor());
  const busy = busyPanels(askedMonitor.data?.queue.jobs ?? []);
  const hasRoomForTheSidebar = useMatchesMedia(ROOM_FOR_THE_SIDEBAR);
  const isClosed = hasRoomForTheSidebar ? isCollapsed : !isDrawerOpen;
  const isFolded = hasRoomForTheSidebar && isCollapsed;

  const requesting = useQuery(requestsQueries.availability());
  const sections = visibleAdminSections(requesting.data?.isEnabled ?? false);
  const items = sections.flatMap((section) => section.items);
  const showing =
    items.find(
      (one) => one.id === (panel === 'logs' ? 'jobs' : panel === 'files' ? 'media' : panel),
    )?.id ?? 'overview';
  const mediaList = {
    library: library ?? null,
    search: find ?? '',
    show: quick ?? 'all',
    sort: order ?? 'title',
    isDescending: desc === true,
    filters: filter ?? [],
  };
  const shownMediaView =
    panel === 'files' || folder !== undefined ? 'folders' : (mediaView ?? 'titles');
  const showingName = items.find((one) => one.id === showing)?.label ?? '';
  const showingGroup =
    sections.find((section) => section.items.some((one) => one.id === showing))?.label ?? null;
  const isPinned = pinned.includes(showing);
  const pinnedItems = pinned.flatMap((id) => items.filter((one) => one.id === id));
  const withCount = <Item extends { id: string }>(item: Item) => ({
    ...item,
    href: `/admin/${item.id}`,
    ...(busy.has(item.id) ? { isBusy: true } : {}),
    ...(counts[item.id] === undefined
      ? {}
      : { count: counts[item.id]?.count ?? 0, isUrgent: counts[item.id]?.isUrgent ?? false }),
  });

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

  const area = (
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
      mediaTitle={media ?? (showing === 'media' ? (title ?? null) : null)}
      webhook={webhook ?? (showing === 'webhooks' ? (title ?? null) : null)}
      linkedServer={server ?? (showing === 'linking' ? (title ?? null) : null)}
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
      mediaList={mediaList}
      onMediaList={(place) => {
        void go({
          to: '/admin/$panel',
          params: { panel: 'media' },
          search: {
            ...(mediaView === undefined ? {} : { mediaView }),
            ...(folder === undefined ? {} : { folder }),
            ...searchOfList(place),
          },
          replace: true,
        });
      }}
      onMediaTitle={(id, place) => {
        const underneath = {
          ...(mediaView === undefined ? {} : { mediaView }),
          ...(folder === undefined ? {} : { folder }),
          ...searchOfList(mediaList),
        };

        void go({
          to: '/admin/$panel',
          params: { panel: 'media' },
          search:
            id === null
              ? underneath
              : {
                  ...underneath,
                  media: id,
                  ...(place === undefined || place.tab === 'details'
                    ? {}
                    : { titleTab: place.tab }),
                  ...(place?.season === null || place?.season === undefined
                    ? {}
                    : { season: place.season }),
                  ...(place?.episode === null || place?.episode === undefined
                    ? {}
                    : { episode: place.episode }),
                  ...(place?.isSeasonPage === true ? { part: 'season' as const } : {}),
                },
        });
      }}
      mediaPlace={{
        tab: titleTab ?? 'details',
        season: season ?? null,
        episode: episode ?? null,
        isSeasonPage: part === 'season',
      }}
      onMediaPlace={(place) => {
        void go({
          to: '/admin/$panel',
          params: { panel: 'media' },
          search: {
            ...(mediaView === undefined ? {} : { mediaView }),
            ...(folder === undefined ? {} : { folder }),
            ...searchOfList(mediaList),
            ...(media === undefined ? {} : { media }),
            ...(place.tab === 'details' ? {} : { titleTab: place.tab }),
            ...(place.season === null ? {} : { season: place.season }),
            ...(place.episode === null ? {} : { episode: place.episode }),
            ...(place.isSeasonPage ? { part: 'season' as const } : {}),
          },
          replace:
            place.episode === (episode ?? null) && place.isSeasonPage === (part === 'season'),
          resetScroll:
            place.season !== (season ?? null) ||
            place.episode !== (episode ?? null) ||
            place.isSeasonPage !== (part === 'season'),
        });
      }}
      onLinkedServer={(id) => {
        void go({
          to: '/admin/$panel',
          params: { panel: 'linking' },
          search: id === null ? {} : { server: id },
        });
      }}
      onWebhook={(id) => {
        void go({
          to: '/admin/$panel',
          params: { panel: 'webhooks' },
          search: id === null ? {} : { webhook: id },
        });
      }}
      onOpenFolder={(path) => {
        void go({
          to: '/admin/$panel',
          params: { panel: 'media' },
          search: { mediaView: 'folders', folder: path },
        });
      }}
      mediaView={shownMediaView}
      onMediaView={(view) => {
        void go({
          to: '/admin/$panel',
          params: { panel: 'media' },
          search: {
            ...searchOfList(mediaList),
            ...(view === 'titles' ? {} : { mediaView: view }),
          },
          replace: true,
        });
      }}
      onMediaFolder={(path) => {
        void go({
          to: '/admin/$panel',
          params: { panel: 'media' },
          search: {
            ...searchOfList(mediaList),
            mediaView: 'folders',
            ...(path === null ? {} : { folder: path }),
          },
          replace: true,
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
  );

  const moveTheSections = (
    <Button
      variant="subtle"
      size="sm"
      isIconOnly
      label={
        navPlace === 'top'
          ? say('screens.adminPage.putTheSectionsDownTheSide')
          : say('screens.adminPage.putTheSectionsAcrossTheTop')
      }
      onClick={() => {
        const next = navPlace === 'top' ? 'side' : 'top';

        setNavPlace(next);
        saveAdminNavPlace(next);
      }}
      className="shrink-0"
    >
      <Icon of={navPlace === 'top' ? PanelLeftIcon : PanelTopIcon} size={15} />
    </Button>
  );

  if (isLoading || !mayAdminister) {
    return (
      <div className="mt-[var(--valence-window-bar)] flex h-[calc(100dvh-var(--valence-window-bar))] items-center justify-center">
        <Spinner size="lg" label={say('screens.adminPage.readingWhatYouMayDo')} />
      </div>
    );
  }

  if (navPlace === 'top' && hasRoomForTheSidebar) {
    return (
      <Tabs
        value={showing}
        onValueChange={(next) => {
          void go({ to: '/admin/$panel', params: { panel: next } });
        }}
      >
        <div className="mt-[var(--valence-window-bar)] flex min-h-[calc(100dvh-var(--valence-window-bar))] flex-col bg-[var(--frame-back)] [--admin-chrome:7.25rem]">
          <header className="sticky top-[var(--valence-window-bar)] z-40 flex flex-col border-b border-[var(--surface-line)] bg-[color-mix(in_oklab,var(--frame-back)_72%,transparent)] backdrop-blur-xl backdrop-saturate-150">
            <div className="flex h-16 items-center gap-1 border-b border-[var(--surface-line)] px-4 sm:px-6">
              <Button
                variant="bare"
                size="none"
                label={say('screens.adminPage.backToValence')}
                hasTooltip={false}
                onClick={() => {
                  void go({ to: '/' });
                }}
                className="flex items-center rounded-md coarse:min-h-11"
              >
                <BrandMark hasMark marksPlace={MARKS_PLACE} />
              </Button>

              <span className="flex-1" />

              <span className="flex items-center gap-2">
                <span className="w-64">
                  <AdminSearch
                    sections={sections}
                    isCompact={false}
                    onGo={(next) => {
                      void go({ to: '/admin/$panel', params: { panel: next } });
                    }}
                  />
                </span>
                <BarButtonGroup>
                  <WaitingOnYou
                    onOpenPanel={(next) => {
                      void go({ to: '/admin/$panel', params: { panel: next } });
                    }}
                  />
                  <div id={ADMIN_NOTICES} className="flex shrink-0 items-center empty:hidden" />
                </BarButtonGroup>
                <AdminStatusFooter
                  isPillOnly
                  version={version}
                  acceleration={acceleration}
                  ffmpeg={ffmpeg}
                  latest={attention.latest}
                  isLatestADevBuild={attention.isLatestADevBuild}
                  onOpenUpdates={() => {
                    void go({ to: '/admin/$panel', params: { panel: 'updates' } });
                  }}
                  isInHeader
                />
                {moveTheSections}
              </span>
            </div>

            <nav
              aria-label={say('common.sections')}
              className="valence-rail flex items-center gap-1 overflow-x-auto px-3 py-2"
            >
              {sections.map((section) => {
                const [first] = section.items;

                if (first === undefined) {
                  return null;
                }

                const isHere = section.items.some((item) => item.id === showing);
                const count = section.items.reduce(
                  (sum, item) => sum + (counts[item.id]?.count ?? 0),
                  0,
                );
                const isBusy = section.items.some((item) => busy.has(item.id));
                const isUrgent = section.items.some(
                  (item) => (counts[item.id]?.count ?? 0) > 0 && counts[item.id]?.isUrgent === true,
                );
                const name = section.label ?? first.label;
                const nameOf = (item: (typeof section.items)[number]) =>
                  item.label === say('screens.adminArea.adminSections.overview') &&
                  section.label !== null
                    ? section.label
                    : item.label;
                const area = (
                  <Button
                    variant="ghost"
                    size="lg"
                    isActive={isHere}
                    {...(isHere ? { 'aria-current': 'page' as const } : {})}
                    onClick={() => {
                      void go({ to: '/admin/$panel', params: { panel: first.id } });
                    }}
                    className="shrink-0"
                  >
                    <Icon
                      of={first.icon}
                      whenActive={first.activeIcon}
                      isActive={isHere}
                      size={16}
                    />
                    {name}
                    {count === 0 ? null : (
                      <Badge size="count" tone={isUrgent ? 'danger' : 'quiet'}>
                        {count.toLocaleString()}
                      </Badge>
                    )}
                    {isBusy ? (
                      <span className="flex scale-75 opacity-50">
                        <Spinner size="xs" label={say('common.running')} />
                      </span>
                    ) : null}
                  </Button>
                );

                return section.items.length < 2 ? (
                  <span key={section.id} className="flex shrink-0">
                    {area}
                  </span>
                ) : (
                  <OptionMenu
                    key={section.id}
                    label={name}
                    anchor={area}
                    align="start"
                    matchTriggerWidth={false}
                    groups={[
                      {
                        name,
                        options: section.items.map((item) => ({
                          id: item.id,
                          label: nameOf(item),
                          icon: (
                            <Icon
                              of={item.icon}
                              whenActive={item.activeIcon}
                              isActive={item.id === showing}
                              size={16}
                            />
                          ),
                          ...((counts[item.id]?.count ?? 0) === 0 && !busy.has(item.id)
                            ? {}
                            : {
                                detail: (
                                  <span className="flex items-center gap-2">
                                    {(counts[item.id]?.count ?? 0) === 0 ? null : (
                                      <Badge
                                        size="count"
                                        tone={
                                          counts[item.id]?.isUrgent === true ? 'danger' : 'quiet'
                                        }
                                      >
                                        {(counts[item.id]?.count ?? 0).toLocaleString()}
                                      </Badge>
                                    )}
                                    {busy.has(item.id) ? (
                                      <span className="flex opacity-60">
                                        <Spinner size="sm" label={say('common.running')} />
                                      </span>
                                    ) : null}
                                  </span>
                                ),
                              }),
                        })),
                        selectedId: showing,
                        onSelect: (id) => {
                          void go({ to: '/admin/$panel', params: { panel: id } });
                        },
                      },
                    ]}
                  />
                );
              })}

              <span className="flex-1" />
              <h1 className="sr-only">{showingName}</h1>
              <div id={ADMIN_PAGE_ACTIONS} className="flex shrink-0 items-center gap-2" />
            </nav>
          </header>

          <div className="mx-2 mb-2 mt-2 flex min-w-0 flex-1 flex-col overflow-clip rounded-2xl border border-[var(--surface-line)] bg-[var(--frame-panel)] shadow-[var(--shadow-raised)] [--card-shell:var(--frame-card)]">
            <div className="flex-1 p-4">{area}</div>
          </div>
        </div>
      </Tabs>
    );
  }

  return (
    <Tabs
      value={showing}
      onValueChange={(next) => {
        void go({ to: '/admin/$panel', params: { panel: next } });
      }}
    >
      <div className="relative mt-[var(--valence-window-bar)] flex min-h-[calc(100dvh-var(--valence-window-bar))] bg-[var(--frame-back)] [--admin-chrome:3.5rem]">
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

        <motion.div
          layout
          layoutRoot
          inert={!hasRoomForTheSidebar && !isDrawerOpen}
          className={
            hasRoomForTheSidebar
              ? 'sticky top-[var(--valence-window-bar)] z-30 h-[calc(100dvh-var(--valence-window-bar))] shrink-0 self-start'
              : cn(
                  'fixed bottom-0 left-0 top-[var(--valence-window-bar)] z-40',
                  'transition-[translate,box-shadow] duration-[var(--duration-slow)] ease-[var(--ease-out)] motion-reduce:transition-none',
                  isDrawerOpen
                    ? 'translate-x-0 shadow-[var(--shadow-lifted)]'
                    : '-translate-x-full',
                )
          }
        >
          <ResizablePanel
            label={say('screens.adminPage.resizeTheSidebar')}
            edge="end"
            defaultWidth={sidebarWidth.read()}
            minWidth={sidebarWidth.narrowest}
            maxWidth={sidebarWidth.widest}
            onWidthChange={sidebarWidth.save}
            isDisabled={!hasRoomForTheSidebar || isFolded}
            className="h-full w-auto"
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
                  hasTooltip={false}
                  className="flex items-center rounded-md coarse:min-h-11"
                >
                  <BrandMark hasMark marksPlace={MARKS_PLACE} />
                </Button>
              }
              groups={[
                ...(pinnedItems.length === 0
                  ? []
                  : [
                      {
                        id: 'pinned',
                        isOpen: folds.pinned ?? true,
                        label: say('screens.observabilityPage.jobHistory.pinnedToTheTop'),
                        items: pinnedItems.map(withCount),
                      },
                    ]),
                ...sections.map((section) => ({
                  id: section.id,
                  isOpen:
                    folds[section.id] ??
                    (!section.isFoldedAtFirst || section.items.some((item) => item.id === showing)),
                  ...(section.label === null ? {} : { label: section.label }),
                  count: section.items.reduce(
                    (sum, item) => sum + (counts[item.id]?.count ?? 0),
                    0,
                  ),
                  items: section.items.map(withCount),
                })),
              ]}
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
              isCollapsed={isFolded}
              collapsedVariant="hidden"
              footer={
                <AdminStatusFooter
                  version={version}
                  acceleration={acceleration}
                  ffmpeg={ffmpeg}
                  latest={attention.latest}
                  isLatestADevBuild={attention.isLatestADevBuild}
                  onOpenUpdates={() => {
                    void go({ to: '/admin/$panel', params: { panel: 'updates' } });
                  }}
                />
              }
            />
          </ResizablePanel>
        </motion.div>

        <div
          inert={!hasRoomForTheSidebar && isDrawerOpen}
          className={cn(
            'flex min-w-0 flex-1 flex-col overflow-clip border-[var(--surface-line)] bg-[var(--frame-panel)] [--card-shell:var(--frame-card)]',
            'md:my-2 md:mr-2 md:rounded-2xl md:border md:shadow-[var(--shadow-raised)]',
            isCollapsed ? 'md:ml-2' : '',
          )}
        >
          <div className="sticky top-[var(--valence-window-bar)] z-40 flex min-h-14 items-center gap-3 border-b border-[var(--surface-line)] bg-[var(--frame-panel)] px-4 py-2.5">
            {isTheDesktopClient() ? null : (
              <SidebarToggle
                isOpen={!isClosed}
                label={isClosed ? say('common.openTheSidebar') : say('common.closeTheSidebar')}
                onToggle={() => {
                  setClosed(!isClosed);
                }}
              />
            )}

            <h1 className="flex min-w-0 flex-1 items-baseline gap-1.5 text-[0.9375rem]">
              {showingGroup === null || showingGroup === showingName ? null : (
                <span className="shrink-0 text-text-muted">{showingGroup} /</span>
              )}
              <span className="truncate font-sans font-semibold text-text">{showingName}</span>
            </h1>

            <div id={ADMIN_PAGE_ACTIONS} className="flex shrink-0 items-center gap-2" />
            <BarButtonGroup>
              <WaitingOnYou
                onOpenPanel={(next) => {
                  void go({ to: '/admin/$panel', params: { panel: next } });
                }}
              />
              <div id={ADMIN_NOTICES} className="flex shrink-0 items-center empty:hidden" />
            </BarButtonGroup>

            {!isClosed ? null : (
              <span className="hidden sm:flex">
                <AdminStatusFooter
                  version={version}
                  acceleration={acceleration}
                  ffmpeg={ffmpeg}
                  latest={attention.latest}
                  isLatestADevBuild={attention.isLatestADevBuild}
                  onOpenUpdates={() => {
                    void go({ to: '/admin/$panel', params: { panel: 'updates' } });
                  }}
                  isInHeader
                />
              </span>
            )}

            {moveTheSections}

            <Button
              variant="subtle"
              size="sm"
              isIconOnly
              label={
                isPinned
                  ? say('screens.adminPage.unpinFromTheSidebar', { name: showingName })
                  : say('screens.adminPage.pinToTheSidebar', { name: showingName })
              }
              aria-pressed={isPinned}
              onClick={() => {
                const next = togglePinned(pinned, showing);

                setPinned(next);
                savePinnedPanels(next);
              }}
              className="shrink-0"
            >
              <Icon of={isPinned ? PinOffIcon : PinIcon} size={15} />
            </Button>
          </div>

          <div className="flex-1 p-4">{area}</div>
        </div>
      </div>
    </Tabs>
  );
};

AdminPage.displayName = 'AdminPage';

export { AdminPage };
