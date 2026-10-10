import { ObservabilitySearchSchema } from '@ValenceClient/admin/ObservabilitySearchSchema';
import { mergeObservabilitySearch } from '@ValenceClient/admin/mergeObservabilitySearch';
import { readObservabilityView } from '@ValenceScreens/components/ObservabilityPage/readObservabilityView';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Sidebar } from '@ValenceUI/Sidebar';
import { SidebarToggle } from '@ValenceUI/SidebarToggle';
import { Spinner } from '@ValenceUI/Spinner';
import { Tabs } from '@ValenceUI/Tabs';
import { cn } from '@ValenceUI/cn';
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
/**
 * The server, as a page of its own rather than something raised over whatever was on screen. Eleven
 * sections is not a row of tabs any more — it is a sidebar, foldable the way any of them are, with
 * every section a real address that can be linked to, refreshed on, and left with the back button.
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
  const [folds, setFolds] = useState(readSidebarFolds);

  const requesting = useQuery(requestsQueries.availability());
  const sections = visibleAdminSections(requesting.data?.isEnabled ?? false);
  const showing =
    sections
      .flatMap((section) => section.items)
      .find((one) => one.id === (panel === 'logs' ? 'jobs' : panel))?.id ?? 'overview';

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
      isOpen: !isCollapsed,
      label: isCollapsed ? say('common.openTheSidebar') : say('common.closeTheSidebar'),
      onToggle: () => {
        const next = !isCollapsed;

        setIsCollapsed(next);
        saveSidebarCollapsed(next);
      },
    });

    return () => {
      setAdminSidebarControl(null);
    };
  }, [isCollapsed, isLoading, mayAdminister]);

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
        {isCollapsed ? null : (
          <Button
            variant="bare"
            size="none"
            label={say('common.closeTheSidebar')}
            onClick={() => {
              setIsCollapsed(true);
              saveSidebarCollapsed(true);
            }}
            className="fixed inset-0 z-30 block bg-scrim/40 md:hidden"
          />
        )}

        <Sidebar
          className="fixed bottom-0 left-0 top-[var(--valence-window-bar)] z-40 bg-[var(--frame-back)] md:sticky md:z-auto md:h-[calc(100dvh-var(--valence-window-bar))] md:self-start"
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
            items: section.items,
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
              isCompact={isCollapsed}
              onGo={(next) => {
                void go({ to: '/admin/$panel', params: { panel: next } });
              }}
            />
          }
          {...(isTheDesktopClient()
            ? {}
            : {
                onCollapsedChange: (next: boolean) => {
                  setIsCollapsed(next);
                  saveSidebarCollapsed(next);
                },
              })}
          isCollapsed={isCollapsed}
          collapsedVariant="hidden"
          footer={
            <div
              className={cn(
                'flex text-xs text-text-muted',
                isCollapsed ? 'flex-col items-center gap-2' : 'flex-col gap-2 px-1',
              )}
            >
              {isCollapsed || acceleration === null ? null : (
                <HoverCard
                  side="right"
                  align="start"
                  detail={
                    <div className="flex max-w-xs flex-col gap-2 text-xs leading-relaxed">
                      <p>{acceleration.detail}</p>

                      {ffmpeg === null ? null : <p className="font-medium text-text">{ffmpeg}</p>}
                    </div>
                  }
                >
                  <span className="block w-full">
                    <Badge size="sm" tone={acceleration.tone} className="w-full justify-center">
                      {acceleration.label}
                    </Badge>
                  </span>
                </HoverCard>
              )}

              {isCollapsed || version === null ? null : (
                <span className="text-center">
                  {say('screens.adminPage.valenceVersion', { version })}
                </span>
              )}
            </div>
          }
        />

        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col overflow-clip border-[var(--surface-line)] bg-[var(--frame-panel)] [--card-shell:var(--frame-card)]',
            'md:my-2 md:mr-2 md:rounded-2xl md:border md:shadow-[var(--shadow-raised)]',
            isCollapsed ? 'md:ml-2' : '',
          )}
        >
          <div className="flex-1 p-4 lg:p-5">
            {isCollapsed && !isTheDesktopClient() ? (
              <div className="mb-3">
                <SidebarToggle
                  isOpen={false}
                  label={say('common.openTheSidebar')}
                  onToggle={() => {
                    setIsCollapsed(false);
                    saveSidebarCollapsed(false);
                  }}
                />
              </div>
            ) : null}

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
