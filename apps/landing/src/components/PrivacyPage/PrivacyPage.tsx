import { ProsePage } from '@ValenceLanding/components/ProsePage/ProsePage';

const SECTION = 'flex flex-col gap-3';

/**
 * What this site does with anything it sees. Valence itself — the software — runs on a server
 * somebody else chose; this page is only about getvalence.app.
 */
const PrivacyPage = () => (
  <ProsePage eyebrow="Last updated 2026 · getvalence.app only" title="Privacy">
    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">What this site is</h2>
      <p>
        getvalence.app is a static marketing site: it has no accounts, no sign-in and nothing of
        yours to lose. Valence, the software, runs on infrastructure you or your host controls: your
        library and your household's data never touch this site or anything we operate.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">What we collect here</h2>
      <p>
        Standard web server logs (the kind any host keeps: IP address, page requested, browser user
        agent) for as long as it takes to notice and fix an outage or an abuse pattern. No cookies
        beyond what's needed to remember your theme choice, no third-party trackers, no analytics
        that follow you off this site.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">The software itself</h2>
      <p>
        Valence is self-hosted. Once it's running, its data (your library, your profiles, your watch
        history) lives on your own server, under your own control. We never see it and never receive
        it.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">Questions</h2>
      <p>
        Open an issue on{' '}
        <a
          href="https://github.com/MarquesCoding/Valence"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text underline underline-offset-4"
        >
          the GitHub repository
        </a>
        .
      </p>
    </section>
  </ProsePage>
);

PrivacyPage.displayName = 'PrivacyPage';

export { PrivacyPage };
