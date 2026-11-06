import { User as UserIcon } from '@keyline-icons/react/duotone';
import { Icon } from '@ValenceUI/Icon';
import { ReadMore } from '@ValenceUI/ReadMore';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import type { AuthorAboutProps } from './AuthorAbout.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Who wrote a book, in its dialog: their portrait, their name, when they lived and how many books
 * they wrote, and their life as Open Library tells it, cut short until somebody asks for the rest.
 *
 * @param author - Who wrote it, as Open Library knows them.
 */
const AuthorAbout = ({ author }: AuthorAboutProps) => {
  const lived =
    author.born === null
      ? null
      : author.died === null
        ? say('screens.bookDialog.bornOn', { date: author.born })
        : say('screens.bookDialog.livedFromTo', { born: author.born, died: author.died });

  return (
    <DialogSection heading={say('screens.bookDialog.aboutTheAuthor')}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {author.photoUrl === null ? (
          <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[var(--surface-hover)]">
            <Icon of={UserIcon} size={36} tone="muted" />
          </span>
        ) : (
          <img
            src={author.photoUrl}
            alt=""
            className="size-24 shrink-0 rounded-full object-cover shadow-md"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold text-text">{author.name}</span>
            <span className="text-sm text-text-muted">
              {[
                lived,
                author.workCount === null
                  ? null
                  : sayCount('screens.bookDialog.count.works', author.workCount),
              ]
                .filter((part) => part !== null)
                .join(' · ')}
            </span>
          </div>

          {author.bio === null ? null : (
            <ReadMore lines={4} className="max-w-[65ch] text-[0.95rem] leading-relaxed text-text">
              {author.bio}
            </ReadMore>
          )}
        </div>
      </div>
    </DialogSection>
  );
};

AuthorAbout.displayName = 'AuthorAbout';

export { AuthorAbout };
