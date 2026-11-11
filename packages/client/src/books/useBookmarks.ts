import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onlineManager, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { forgetBookmark, saveBookmark } from '@ValenceClient/books/fetchBookmarks';
import { readKeptBookmarks } from '@ValenceClient/books/readKeptBookmarks';
import { takeOldBookmarks } from '@ValenceClient/books/takeOldBookmarks';
import { writeKeptBookmarks } from '@ValenceClient/books/writeKeptBookmarks';
import { randomId } from '@ValenceClient/platform/randomId';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { useOfflineMode } from '@ValenceClient/offline/useOfflineMode';
import type { BookmarkChange, KeptBookmarks } from '@ValenceClient/books/KeptBookmarks';
import type { Bookmark } from '@ValenceContracts/schemas/Book';

const TRY_AGAIN_MS = 30_000;

type BookmarkPlace = Pick<
  Bookmark,
  'chapterId' | 'pageNumber' | 'fraction' | 'pageShown' | 'excerpt' | 'picture'
>;

type Bookmarks = {
  bookmarks: Bookmark[];
  add: (place: BookmarkPlace) => void;
  remove: (bookmarkIds: readonly string[]) => void;
};

/**
 * Whether two changes waiting to be sent are the same change.
 *
 * @param one - A change.
 * @param other - Another.
 * @returns Whether they are one and the same.
 */
const isSameChange = (one: BookmarkChange, other: BookmarkChange): boolean =>
  one.kind === 'add'
    ? other.kind === 'add' && other.bookmark.id === one.bookmark.id
    : other.kind === 'remove' && other.bookmarkId === one.bookmarkId;

/**
 * A book's bookmarks for the profile reading it, kept on the server and on this device both.
 *
 * Marking and unmarking take effect at once and are kept on the device, then sent to the server in
 * the order they were made, each under the bookmark's own id so that one sent twice counts once.
 * Where the server cannot be reached, as on a phone reading a downloaded book with no signal, or
 * the device has been put offline, they wait on the device and go when it is back, trying again
 * every so often while any wait. A server too old to keep bookmarks leaves them on the device alone. The bookmarks this device kept before they were kept on the server are carried over
 * the first time the book is opened.
 *
 * @param bookId - The book.
 * @param chapterIds - Its chapters, in reading order, which is the order its bookmarks come in.
 * @returns The bookmarks, and how to add and remove them.
 */
const useBookmarks = (bookId: string, chapterIds: readonly string[]): Bookmarks => {
  const cache = useQueryClient();
  const hasServer = useServerHas('books.bookmarks');
  const { isOffline } = useOfflineMode();
  const [tries, setTries] = useState(0);
  const [kept, setKept] = useState<KeptBookmarks>(() => readKeptBookmarks(bookId));
  const keptNow = useRef(kept);
  const isSending = useRef(false);
  const asked = useQuery({ ...bookQueries.bookmarks(bookId), enabled: hasServer === true });
  const chapters = chapterIds.join(',');

  const keep = useCallback(
    (change: (was: KeptBookmarks) => KeptBookmarks) => {
      const next = change(keptNow.current);

      keptNow.current = next;
      writeKeptBookmarks(bookId, next);
      setKept(next);
    },
    [bookId],
  );

  useEffect(() => {
    const old = takeOldBookmarks(
      bookId,
      chapters.split(',').filter((one) => one !== ''),
    );

    if (old.length > 0) {
      keep((was) => ({
        ...was,
        waiting: [...was.waiting, ...old.map((bookmark) => ({ kind: 'add' as const, bookmark }))],
      }));
    }
  }, [bookId, chapters, keep]);

  useEffect(() => {
    const known = asked.data;

    if (known !== undefined) {
      keep((was) => ({ ...was, known }));
    }
  }, [asked.data, keep]);

  const canSend = hasServer === true && asked.isSuccess && !isOffline;
  const isWaiting = kept.waiting.length > 0;

  useEffect(
    () =>
      onlineManager.subscribe((isOnline) => {
        if (isOnline) {
          setTries((was) => was + 1);
        }
      }),
    [],
  );

  useEffect(() => {
    if (!isWaiting || !canSend) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTries((was) => was + 1);
    }, TRY_AGAIN_MS);

    return () => {
      clearInterval(timer);
    };
  }, [canSend, isWaiting]);

  useEffect(() => {
    if (!canSend || kept.waiting.length === 0 || isSending.current) {
      return;
    }

    isSending.current = true;

    void (async () => {
      let hasSent = false;

      for (;;) {
        const change = keptNow.current.waiting[0];

        if (change === undefined) {
          break;
        }

        const answer =
          change.kind === 'add'
            ? await saveBookmark(change.bookmark)
            : await forgetBookmark(bookId, change.bookmarkId);

        if (answer === 'unreachable') {
          break;
        }

        hasSent = true;
        keep((was) => {
          const waiting = was.waiting.filter((one) => !isSameChange(one, change));

          if (change.kind === 'remove') {
            return { waiting, known: was.known.filter((one) => one.id !== change.bookmarkId) };
          }

          if (answer !== 'done') {
            return { waiting, known: was.known };
          }

          return waiting.length === was.waiting.length
            ? {
                known: was.known,
                waiting: [...waiting, { kind: 'remove', bookmarkId: change.bookmark.id }],
              }
            : {
                waiting,
                known: [
                  ...was.known.filter((one) => one.id !== change.bookmark.id),
                  change.bookmark,
                ],
              };
        });
      }

      isSending.current = false;

      if (hasSent) {
        void cache.invalidateQueries({ queryKey: bookQueries.bookmarks(bookId).queryKey });
      }
    })();
  }, [asked.dataUpdatedAt, bookId, cache, canSend, keep, kept.waiting.length, tries]);

  const bookmarks = useMemo(() => {
    const order = chapters.split(',');
    const removed = new Set(
      kept.waiting.flatMap((one) => (one.kind === 'remove' ? [one.bookmarkId] : [])),
    );
    const added = kept.waiting.flatMap((one) => (one.kind === 'add' ? [one.bookmark] : []));
    const addedIds = new Set(added.map((one) => one.id));
    const rank = (bookmark: Bookmark) => {
      const at = order.indexOf(bookmark.chapterId);

      return at === -1 ? order.length : at;
    };

    return [...kept.known.filter((one) => !addedIds.has(one.id)), ...added]
      .filter((one) => !removed.has(one.id) && rank(one) < order.length)
      .sort(
        (one, other) =>
          rank(one) - rank(other) ||
          (one.pageNumber ?? one.fraction ?? 0) - (other.pageNumber ?? other.fraction ?? 0),
      );
  }, [chapters, kept]);

  const add = useCallback(
    (place: BookmarkPlace) => {
      const bookmark: Bookmark = {
        ...place,
        id: randomId(),
        bookId,
        createdAt: new Date().toISOString(),
      };

      keep((was) => ({ ...was, waiting: [...was.waiting, { kind: 'add', bookmark }] }));
    },
    [bookId, keep],
  );

  const remove = useCallback(
    (bookmarkIds: readonly string[]) => {
      keep((was) => {
        const unsent = new Set(
          was.waiting.flatMap((one) =>
            one.kind === 'add' && bookmarkIds.includes(one.bookmark.id) ? [one.bookmark.id] : [],
          ),
        );

        return {
          ...was,
          waiting: [
            ...was.waiting.filter((one) => one.kind !== 'add' || !unsent.has(one.bookmark.id)),
            ...bookmarkIds
              .filter((one) => !unsent.has(one))
              .map((bookmarkId) => ({ kind: 'remove' as const, bookmarkId })),
          ],
        };
      });
    },
    [keep],
  );

  return { bookmarks, add, remove };
};

export type { BookmarkPlace, Bookmarks };

export { useBookmarks };
