import { Bookmark as BookmarkIcon, X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import type { ReaderBookmarksProps } from './ReaderBookmarks.types';
import { say } from '@ValenceI18n/say';

/**
 * The places marked in a book, listed in a reader's side panel in the order they come in the book:
 * each named by its page or how far through it is, with its chapter where the book has more than
 * one, and a picture of the page or the words that start there. Choosing one goes there, and each
 * can be removed from beside it.
 *
 * @param bookmarks - The bookmarks.
 * @param onOpen - Told to go to a bookmark.
 * @param onRemove - Told to remove a bookmark.
 */
const ReaderBookmarks = ({ bookmarks, onOpen, onRemove }: ReaderBookmarksProps) => (
  <section aria-label={say('common.bookmarks')} className="flex flex-col gap-2">
    <h3 className="text-xs text-text-muted">{say('common.bookmarks')}</h3>

    {bookmarks.length === 0 ? (
      <div className="rounded-lg border border-[var(--surface-line)] bg-[var(--surface-hover)]">
        <NothingHere
          of={BookmarkIcon}
          title={say('common.noBookmarksYet')}
          detail={say('common.pagesYouBookmarkAppearHere')}
          isCompact
        />
      </div>
    ) : (
      <ul className="-mx-2 flex flex-col">
        {bookmarks.map((bookmark) => (
          <li key={bookmark.id} className="flex items-start gap-1">
            <Button
              variant="row"
              size="none"
              className="min-w-0 flex-1 items-start gap-3 p-2"
              onClick={() => {
                onOpen(bookmark.id);
              }}
            >
              {bookmark.picture === null ? null : (
                <img
                  src={bookmark.picture}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="h-14 w-10 shrink-0 rounded-sm bg-[var(--surface-hover)] object-cover"
                />
              )}

              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-text">{bookmark.place}</span>

                {bookmark.chapter === null ? null : (
                  <span className="truncate text-xs text-text-muted">{bookmark.chapter}</span>
                )}

                {bookmark.excerpt === null ? null : (
                  <span className="line-clamp-2 text-xs text-text-muted">{bookmark.excerpt}</span>
                )}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="xs"
              isIconOnly
              label={say('common.removeBookmarkAt', { place: bookmark.place })}
              className="mt-2 shrink-0"
              onClick={() => {
                onRemove(bookmark.id);
              }}
            >
              <Icon of={XIcon} size={14} />
            </Button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

ReaderBookmarks.displayName = 'ReaderBookmarks';

export { ReaderBookmarks };
