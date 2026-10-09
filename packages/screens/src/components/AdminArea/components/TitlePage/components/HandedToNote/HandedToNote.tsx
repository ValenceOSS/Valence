import { Link } from '@ValenceUI/Link';
import type { HandedToNoteProps } from './HandedToNote.types';
import { say } from '@ValenceI18n/say';

/**
 * Says a title is handled by a connected app — which searches, downloads and imports it while
 * Valence follows what it does — with a link to its page there, where the app's address is known.
 *
 * @param handedTo - The app it was handed to.
 */
const HandedToNote = ({ handedTo }: HandedToNoteProps) => (
  <section
    aria-label={say('screens.adminArea.titlePage.handedToNote.handledByName', {
      name: handedTo.appName,
    })}
    className="flex flex-col gap-2 rounded-2xl border border-[var(--surface-line)] bg-surface-raised p-5 sm:flex-row sm:items-center"
  >
    <p className="flex-1 text-sm text-text">
      {say('screens.adminArea.titlePage.handedToNote.nameSearchesDownloadsAndImports', {
        name: handedTo.appName,
      })}
    </p>

    {handedTo.link === null ? null : (
      <Link href={handedTo.link} className="text-sm font-medium text-accent">
        {say('screens.adminArea.titlePage.handedToNote.openInName', { name: handedTo.appName })}
      </Link>
    )}
  </section>
);

HandedToNote.displayName = 'HandedToNote';

export { HandedToNote };
