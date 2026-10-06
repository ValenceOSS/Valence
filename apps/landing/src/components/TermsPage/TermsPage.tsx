import { GITHUB_URL } from '@ValenceLanding/content/GITHUB_URL';
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
        responsibility for, any instance of Valence you or anyone else runs.
      </p>
    </section>

    <section className={SECTION}>
      <h2 className="text-lg font-semibold text-text">The full licence</h2>
      <p>
        Read it in full at{' '}
        <a
          href={`${GITHUB_URL}/blob/main/LICENSE.md`}
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
