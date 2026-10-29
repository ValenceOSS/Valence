'use client';

import { Link } from '@ValenceUI/Link';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SOURCE_URL } from '@ValenceMetrics/constants/SOURCE_URL';
import { TELEMETRY_DOCS_URL } from '@ValenceMetrics/constants/TELEMETRY_DOCS_URL';

const SENT = [
  'A random id the server made for itself, which says nothing about who runs it',
  'The Valence version, how it was installed and which database it uses',
  'The operating system, its release and the processor architecture',
  'The processor’s model name and how many cores it has',
  'Roughly how much memory there is, as a range such as 16 to 32 GB',
  'The graphics hardware and which hardware video backends work on it',
  'Roughly how big each library is, as a range such as 100 to 999 films',
  'Which kinds of app have watched in the last 30 days, again only as a range',
];

const NEVER = [
  'The address the report came from. The site never writes it down',
  'The browser or program that sent it',
  'Any name, title, file, path, account, person or place',
  'Anything about what anybody watched, or when',
];

/**
 * Says what the statistics are made from, what is never sent or kept, how small groups are hidden
 * and how to stop a server reporting.
 */
const AboutPage = () => (
  <div className="flex max-w-3xl flex-col gap-8">
    <section className="flex flex-col gap-3">
      <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        About this data
      </h1>

      <p className="text-base text-text-muted">
        Valence is built by people who cannot see how it is used. These figures are how they find
        out which systems to test on, which graphics hardware to support and when an old version can
        be left behind, without asking anybody to give up anything about themselves.
      </p>
    </section>

    <div className="rounded-2xl bg-[var(--frame-panel)] p-2 [--card-shell:var(--frame-card)] sm:p-3">
      <div className="flex flex-col gap-2 sm:gap-3">
        <PanelCard title="What a server sends, once a day">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-text">
            {SENT.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="What is never sent or kept">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-text">
            {NEVER.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="How a single server stays hidden">
          <div className="flex flex-col gap-3 text-sm text-text">
            <p>
              Only totals are ever shown, here or through the JSON the page is drawn from. Any
              answer fewer than three servers give is folded into “Other”, so an unusual graphics
              card or a version nobody else runs cannot point to one server. Until three servers
              have reported, nothing but the count is shown at all.
            </p>
            <p>
              A server counts as active while it has reported in the last 30 days. Its latest report
              replaces its last one, and a server that reports more than once an hour is turned
              away.
            </p>
          </div>
        </PanelCard>

        <PanelCard title="Turning it off">
          <div className="flex flex-col gap-3 text-sm text-text">
            <p>
              Reporting is on unless a server is told otherwise, and any server can be told not to
              send it at any time; the documentation says how. A server that stops reporting drops
              out of the figures after 30 days.
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-1">
              <Link href={TELEMETRY_DOCS_URL}>Exactly what is sent, field by field</Link>
              <Link href={SOURCE_URL}>The code for this site</Link>
            </p>
          </div>
        </PanelCard>
      </div>
    </div>
  </div>
);

AboutPage.displayName = 'AboutPage';

export { AboutPage };
