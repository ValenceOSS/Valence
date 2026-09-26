import { ObservabilitySearchSchema } from '@ValenceClient/admin/ObservabilitySearchSchema';
import { mergeObservabilitySearch } from '@ValenceClient/admin/mergeObservabilitySearch';
import { readObservabilityView } from '@ValenceScreens/components/ObservabilityPage/readObservabilityView';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PanelLeft as PanelLeftIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Logo } from '@ValenceUI/Logo';
import { Sidebar } from '@ValenceUI/Sidebar';
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
  const go = useNavigate();
  const { panel } = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const { job } = search;
  const { mayAdminister, isLoading } = useWhatIMayDo();
  const observability = ObservabilitySearchSchema.parse(search);
  const view = readObservabilityView(observability.view, panel);
  const [isCollapsed, setIsCollapsed] = useState(readSidebarCollapsed);

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

  if (isLoading || !mayAdminister) {
    return (
      <div className="mt-[var(--valence-window-bar)] flex h-[calc(100dvh-var(--valence-window-bar))] items-center justify-center">
        <Spinner size="lg" label="Reading what you may do" />
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
      <div className="relative mt-[var(--valence-window-bar)] flex h-[calc(100dvh-var(--valence-window-bar))] overflow-hidden bg-surface">
        {isCollapsed ? null : (
          <Button
            variant="bare"
            size="none"
            label="Close the sidebar"
            onClick={() => {
              setIsCollapsed(true);
              saveSidebarCollapsed(true);
            }}
            className="fixed inset-0 z-30 block bg-scrim/40 md:hidden"
          />
        )}

        <Sidebar
          className="fixed bottom-0 left-0 top-[var(--valence-window-bar)] z-40 md:static md:z-auto"
          label="Server"
          brand={
            <Button
              variant="bare"
              size="none"
              label="Back to Valence"
              onClick={() => {
                void go({ to: '/' });
              }}
              className="flex items-center gap-2"
            >
              <Logo size={24} isSolid />
              {isCollapsed ? null : <span className="font-semibold text-text">Valence</span>}
            </Button>
          }
          groups={sections.map((section) => ({
            ...(section.label === null ? {} : { label: section.label }),
            items: section.items,
          }))}
          value={showing}
          onSelect={(next) => {
            void go({ to: '/admin/$panel', params: { panel: next } });
          }}
          isCollapsed={isCollapsed}
          onCollapsedChange={(next) => {
            setIsCollapsed(next);
            saveSidebarCollapsed(next);
          }}
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
                <span className="text-center">Valence {version}</span>
              )}
            </div>
          }
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {!isCollapsed ? null : (
            <div className="flex shrink-0 items-center border-b border-[var(--surface-line)] px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                label="Open the sidebar"
                onClick={() => {
                  setIsCollapsed(false);
                  saveSidebarCollapsed(false);
                }}
              >
                <Icon of={PanelLeftIcon} size={17} />
              </Button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
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
