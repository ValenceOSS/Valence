import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { Query, QueryClient } from '@tanstack/react-query';
import type { MediaNews } from '@ValenceClient/query/gatherMediaNews';

const RAILS: ReadonlySet<string> = new Set([
  'across',
  'picked-for-you',
  'home-shelves',
  'coming-up',
]);

const ABOUT_ONE: ReadonlySet<string> = new Set(['detail', 'like-this']);

/**
 * Reads which part of the library a query asks about.
 *
 * @param query - The query.
 * @param at - Which part of its key.
 * @returns That part, where it is a word.
 */
const partOf = (query: Query, at: number): string | null => {
  const part = query.queryKey[at];

  return typeof part === 'string' ? part : null;
};

/**
 * Throws away what a gathered run of media events said is out of date: everything they touch where
 * they named nothing, and otherwise only the pages of the titles they named, the rows of the home
 * page and what is drawn from the likeness of titles, leaving the rest to be read again the next
 * time it is looked at. New artwork asks again for every library list on screen, since a list
 * that is not read again goes on drawing the picture it was given.
 *
 * @param cache - The query cache.
 * @param news - What the events said changed.
 */
const freshenAfterMedia = (cache: QueryClient, news: MediaNews): void => {
  if (news.isEverything) {
    void cache.invalidateQueries({ queryKey: libraryQueries.key });
    void cache.invalidateQueries({ queryKey: musicQueries.key });
    void cache.invalidateQueries({ queryKey: musicQueries.playlistsKey });
    void cache.invalidateQueries({ queryKey: collectionQueries.key });
    void cache.invalidateQueries({ queryKey: requestsQueries.key });
    void cache.invalidateQueries({ queryKey: viewingQueries.becauseYouWatched(true).queryKey });

    return;
  }

  const named = new Set([...news.artwork, ...news.changed]);

  if (named.size > 0) {
    artworkRevisions.bump([...news.artwork]);
    void cache.invalidateQueries({
      queryKey: libraryQueries.key,
      refetchType: news.artwork.size > 0 ? 'active' : 'none',
    });
    void cache.invalidateQueries({
      queryKey: libraryQueries.key,
      predicate: (query) => {
        const about = partOf(query, 1);
        const mediaId = partOf(query, 2);

        return about !== null && ABOUT_ONE.has(about) && mediaId !== null && named.has(mediaId);
      },
    });
  }

  if (news.changed.size > 0) {
    void cache.invalidateQueries({ queryKey: musicQueries.key, refetchType: 'none' });
    void cache.invalidateQueries({
      queryKey: libraryQueries.key,
      predicate: (query) => {
        const about = partOf(query, 1);

        return about !== null && RAILS.has(about);
      },
    });
  }

  if (news.isCollections) {
    void cache.invalidateQueries({ queryKey: collectionQueries.key });
  }

  if (news.isLikeness) {
    void cache.invalidateQueries({ queryKey: viewingQueries.becauseYouWatched(true).queryKey });
    void cache.invalidateQueries({ queryKey: [...libraryQueries.key, 'like-this'] });
    void cache.invalidateQueries({ queryKey: [...libraryQueries.key, 'picked-for-you'] });
  }
};

export { freshenAfterMedia };
