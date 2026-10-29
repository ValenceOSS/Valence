import { VALENCE_REPOSITORY_URL } from '@ValenceCore/project/VALENCE_REPOSITORY_URL';
import { ProsePage } from '@ValenceLanding/components/ProsePage/ProsePage';

const SECTION = 'flex flex-col gap-3';

/**
 * What this site does with anything it sees, and the one anonymous report a day the software sends
 * from the server somebody else chose to run it on.
 */
const PrivacyPage = () => (
  <ProsePage eyebrow="Last updated October 2026" title="Privacy">
    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">What this site is</h2>
      <p>
        getvalence.app is a static marketing site, hosted on Vercel: it has no accounts, no sign-in
        and nothing of yours to lose. Valence, the software, runs on infrastructure you or your host
        controls: your library and your household's data never touch this site or anything we
        operate. The one thing a server sends us is the anonymous report described below. The one
        server we run, demo.getvalence.app, is only a demo with its own sample library, and nothing
        you install depends on it.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">What we collect here</h2>
      <p>
        Standard web server logs (the kind any host keeps: IP address, page requested, browser user
        agent) for as long as it takes to notice and fix an outage or an abuse pattern. No cookies
        at all: your theme choice is kept in your own browser's local storage. No third-party
        trackers, and no analytics that follow you off this site. The fonts are served from this
        site, not a font service.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">What loads from other sites</h2>
      <p>
        Three things, and only where they apply. The UI library's video example shows a YouTube
        video through youtube-nocookie.com, so opening it loads that video from YouTube. The plugins
        page shows a plugin's icon from the plugin catalogue on GitHub Pages, where the plugin has
        one. And Safari on an iPhone asks Apple for the App Store banner it offers at the top of the
        page. Nothing else on this site loads from anywhere but here.
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
      <h2 className="text-lg font-semibold text-text">
        The anonymous statistics the software sends
      </h2>
      <p>
        Once a day, a Valence server sends us one short report about itself, unless whoever runs it
        has turned that off. It holds the release it runs and how it was installed; the system,
        kernel release and architecture; the processor's model and number of cores; roughly how much
        memory the machine has; its graphics cards and the hardware encoders that work on them;
        whether its database is Postgres, MySQL or MariaDB; roughly how many films, episodes, songs
        and books its own libraries hold; and roughly how many browsers, desktop, television and
        phone apps played something since the last report. Every count is a band, such as 100 to
        999, never the number itself. The report also carries a random install ID the server makes
        for itself, which comes from nothing about the machine or the people using it, so that one
        install counts once.
      </p>
      <p>
        It never holds names, email addresses, usernames, titles, file names or paths, the addresses
        the server is reached on, or anything about what anybody watched, listened to or read. It
        travels over HTTPS to metrics.getvalence.app, which does not store the IP address it came
        from.
      </p>
      <p>
        We use the reports only to see how Valence is used, so we know what to test and what to work
        on, and we publish only the totals, never one install's reports, at{' '}
        <a
          href="https://metrics.getvalence.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text underline underline-offset-4"
        >
          metrics.getvalence.app
        </a>
        . An install's reports are kept for as long as it keeps reporting. An install we have not
        heard from for twelve months is deleted, with everything it sent.
      </p>
      <p>
        It is on by default and easy to stop: turn off Share anonymous usage statistics in setup or
        in Settings, or set VALENCE_TELEMETRY=off or DO_NOT_TRACK=1 in the server's environment. See
        what is sent, in Settings, shows the exact report before it goes, and Make a new install ID
        replaces the ID it carries. Every field is listed in{' '}
        <a
          href="https://docs.getvalence.app/use/telemetry"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text underline underline-offset-4"
        >
          the documentation
        </a>
        .
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">Questions</h2>
      <p>
        Open an issue on{' '}
        <a
          href={VALENCE_REPOSITORY_URL}
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
