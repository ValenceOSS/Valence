import { VALENCE_REPOSITORY_URL } from '@ValenceCore/project/VALENCE_REPOSITORY_URL';
import { ProsePage } from '@ValenceLanding/components/ProsePage/ProsePage';

const SECTION = 'flex flex-col gap-3';

/**
 * The terms for using getvalence.app and the software it points to.
 */
const TermsPage = () => (
  <ProsePage eyebrow="Last updated 2026" title="Terms">
    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">This site</h2>
      <p>
        getvalence.app is provided as-is, to tell you about Valence and point you at where to get
        it. There's nothing to sign up for and nothing to agree to just to read it.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">The software</h2>
      <p>
        Valence is free and open source software, licensed under the MIT licence. You may use,
        modify, and distribute it, including commercially, subject to that licence: in short, keep
        the copyright notice with it, and it comes with no warranty of any kind.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">Running it yourself</h2>
      <p>
        Because Valence is self-hosted, you are responsible for the server you run it on, the media
        you point it at, and who you give access to. We have no visibility into, and no
        responsibility for, any instance of Valence you or anyone else runs, beyond the anonymous
        statistics below.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">Anonymous usage statistics</h2>
      <p>
        If you turn it on, a Valence server sends us one anonymous report a day: its release, the
        kind of machine and database it runs on, its graphics cards, and banded counts of what its
        libraries hold and which kinds of app played something, with a random install ID it makes
        for itself. It never holds names, email addresses, titles, file paths or what anybody
        watched, and the metrics server does not store IP addresses. We use the reports only to see
        how Valence is used, and publish only the totals, at metrics.getvalence.app. Reports are
        kept while an install keeps reporting, and an install not heard from for twelve months is
        deleted with its reports.
      </p>
      <p>
        It is on by default. You can turn it off in setup, in Settings, or by setting
        VALENCE_TELEMETRY=off or DO_NOT_TRACK=1, and Settings shows the exact report before it goes.
        If you run Valence for other people, it is yours to tell them. The Privacy page says more,
        and{' '}
        <a
          href="https://docs.getvalence.app/use/telemetry"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text underline underline-offset-4"
        >
          the documentation
        </a>{' '}
        lists every field.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">The full licence</h2>
      <p>
        Read it in full at{' '}
        <a
          href={`${VALENCE_REPOSITORY_URL}/blob/main/LICENSE.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text underline underline-offset-4"
        >
          LICENSE.md
        </a>
        .
      </p>
    </section>
  </ProsePage>
);

TermsPage.displayName = 'TermsPage';

export { TermsPage };
