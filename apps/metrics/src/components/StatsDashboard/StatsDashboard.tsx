'use client';

import { ChartBar as ChartBarIcon } from '@keyline-icons/react';
import { BarList } from '@ValenceUI/BarList';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { Link } from '@ValenceUI/Link';
import { NothingHere } from '@ValenceUI/NothingHere';
import { PanelCard } from '@ValenceUI/PanelCard';
import { StatTile } from '@ValenceUI/StatTile';
import { TrendChart } from '@ValenceUI/TrendChart';
import { ShareCard } from '@ValenceMetrics/components/ShareCard/ShareCard';
import { TELEMETRY_DOCS_URL } from '@ValenceMetrics/constants/TELEMETRY_DOCS_URL';
import { formatCount } from '@ValenceMetrics/format/formatCount';
import { formatDay } from '@ValenceMetrics/format/formatDay';
import type { StatsDashboardProps } from './StatsDashboard.types';

const RECENT_RELEASES = 8;

const MORE_THAN_ONE = 'A server can have more than one, so these can add up to more than 100%.';

const FRAME = 'rounded-2xl bg-[var(--frame-panel)] p-2 [--card-shell:var(--frame-card)] sm:p-3';

const GRID = 'grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-4';

/**
 * The public statistics: how many Valence servers report, how that has moved, how often Valence
 * has been downloaded, and what the servers that report run on and hold, each as a ranked list of
 * shares.
 *
 * @param stats - The figures, summed up from the reports.
 * @param downloads - How often each release has been downloaded.
 */
const StatsDashboard = ({ stats, downloads }: StatsDashboardProps) => {
  const latest = downloads.releases[0];
  const busiest = Math.max(1, ...stats.trend.map(({ installs }) => installs));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          How Valence is run
        </h1>

        <p className="text-base text-text-muted">
          Once a day, each Valence server whose owner turned it on sends one anonymous report about
          the machine it runs on and the rough size of its library. It never says what is in the
          library, who watches it or where the server is. These are the totals across every server
          that reported in the last 30 days. Reporting is off unless a server’s owner turns it on,
          in Settings or while setting it up.
        </p>

        <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href={TELEMETRY_DOCS_URL}>Exactly what is sent</Link>
          <Link href="/about">About this data</Link>
          <Link href="/api/v1/stats">The figures as JSON</Link>
        </p>
      </section>

      <div className={FRAME}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <StatTile
            label="Active servers"
            value={formatCount(stats.activeInstalls)}
            detail="In the last 30 days"
          />
          <StatTile
            label="Reported today"
            value={formatCount(stats.reportedToday)}
            detail="In the last 24 hours"
          />
          <StatTile
            label="Downloads"
            value={downloads.isKnown ? formatCount(downloads.total) : '–'}
            detail="All releases, GitHub"
          />
          <StatTile
            label="Latest release"
            value={latest === undefined ? '–' : latest.tag}
            detail={
              latest === undefined
                ? 'Not known yet'
                : `${formatCount(latest.downloads)} ${latest.downloads === 1 ? 'download' : 'downloads'}`
            }
          />
        </div>

        <div className="mt-2 grid gap-2 sm:mt-3 sm:gap-3 lg:grid-cols-3">
          <PanelCard
            title="Active servers over the last 90 days"
            className="min-h-80 lg:col-span-2"
          >
            <TrendChart
              values={stats.trend.map(({ installs }) => installs)}
              ceiling={Math.ceil(busiest * 1.15)}
              label="Active servers over the last 90 days"
              fills
              tipOf={(at) => {
                const day = stats.trend[at];

                return day === undefined
                  ? null
                  : `${formatDay(day.day)}: ${formatCount(day.installs)} active`;
              }}
              caption="Each day counts the servers that reported in the 30 days up to it."
            />
          </PanelCard>

          <PanelCard title="Downloads by release">
            <div className="-mx-2 -my-1">
              <BarList
                items={downloads.releases
                  .slice(0, RECENT_RELEASES)
                  .map(({ tag, downloads: count }) => ({
                    id: tag,
                    label: tag,
                    value: count,
                  }))}
                label="Downloads by release"
                heading="Release"
                valueHeading="Downloads"
                emptyMessage="GitHub could not be asked just now."
                figureOf={({ value }) => formatCount(value)}
                fill="solid"
              />
            </div>
          </PanelCard>
        </div>
      </div>

      {stats.isEnoughToShow ? (
        <>
          <HeadedSection title="The software">
            <div className={FRAME}>
              <div className={GRID}>
                <ShareCard title="Version" heading="Version" rows={stats.versions} />
                <ShareCard
                  title="How it is installed"
                  heading="Install"
                  rows={stats.installMethods}
                />
                <ShareCard title="Database" heading="Database" rows={stats.databases} />
                <ShareCard
                  title="Apps people watch on"
                  heading="App"
                  rows={stats.clients}
                  note="Servers that saw each kind of app in the last 30 days. Most see more than one."
                />
              </div>
            </div>
          </HeadedSection>

          <HeadedSection title="The machines">
            <div className={FRAME}>
              <div className={GRID}>
                <ShareCard title="Operating system" heading="System" rows={stats.platforms} />
                <ShareCard title="Architecture" heading="Architecture" rows={stats.architectures} />
                <ShareCard title="Processor maker" heading="Maker" rows={stats.cpuVendors} />
                <ShareCard title="Processor cores" heading="Cores" rows={stats.cores} />
                <ShareCard title="Memory" heading="Memory" rows={stats.memory} />
                <ShareCard
                  title="Graphics maker"
                  heading="Maker"
                  rows={stats.gpuVendors}
                  note={MORE_THAN_ONE}
                />
                <ShareCard
                  title="Graphics cards"
                  heading="Model"
                  rows={stats.gpuModels}
                  note={MORE_THAN_ONE}
                />
                <ShareCard
                  title="Hardware video acceleration"
                  heading="Backend"
                  rows={stats.accels}
                  note={MORE_THAN_ONE}
                />
              </div>
            </div>
          </HeadedSection>

          <HeadedSection title="The libraries">
            <div className={FRAME}>
              <div className={GRID}>
                <ShareCard title="Films" heading="Films" rows={stats.library.films} />
                <ShareCard title="Episodes" heading="Episodes" rows={stats.library.episodes} />
                <ShareCard title="Music tracks" heading="Tracks" rows={stats.library.tracks} />
                <ShareCard title="Books" heading="Books" rows={stats.library.books} />
              </div>
            </div>
          </HeadedSection>
        </>
      ) : (
        <div className={FRAME}>
          <PanelCard title="What the servers run on">
            <NothingHere
              of={ChartBarIcon}
              title="Not enough reports yet"
              detail="The figures appear once at least three servers have reported, so that no one server can be picked out."
              isCompact
            />
          </PanelCard>
        </div>
      )}
    </div>
  );
};

StatsDashboard.displayName = 'StatsDashboard';

export { StatsDashboard };
