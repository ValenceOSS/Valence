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
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {author.photoUrl === null ? (
          <span className="flex aspect-[2/3] w-32 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-hover)] sm:w-40">
            <Icon of={UserIcon} size={40} tone="muted" />
          </span>
        ) : (
          <img
            src={author.photoUrl}
            alt=""
            className="aspect-[2/3] w-32 shrink-0 rounded-xl object-cover shadow-md sm:w-40"
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
                  : sayCount('common.count.books', author.workCount),
              ]
                .filter((part) => part !== null)
                .join(' · ')}
            </span>
          </div>

          {author.bio === null ? null : (
            <ReadMore lines={7} className="text-[0.95rem] leading-relaxed text-text">
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
