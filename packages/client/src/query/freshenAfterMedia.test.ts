import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { freshenAfterMedia } from '@ValenceClient/query/freshenAfterMedia';
import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';
import type { MediaNews } from '@ValenceClient/query/gatherMediaNews';

const NOTHING: MediaNews = {
  isEverything: false,
  artwork: new Set(),
  changed: new Set(),
  isCollections: false,
  isLikeness: false,
};

let cache: QueryClient;

beforeEach(() => {
  cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
});

describe('freshenAfterMedia', () => {
  it('throws away the whole library and what is drawn from it where nothing was named', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);

    freshenAfterMedia(cache, { ...NOTHING, isEverything: true });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['library'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['requests'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['viewing', 'because-you-watched'] });
  });

  it('notes new artwork and asks again for the library lists on screen, which would go on drawing the old picture', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const bump = vi.spyOn(artworkRevisions, 'bump');

    freshenAfterMedia(cache, { ...NOTHING, artwork: new Set(['one']) });

    expect(bump).toHaveBeenCalledWith(['one']);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['library'], refetchType: 'active' });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['library'] });
  });

  it('marks the rest of the library stale without asking for it again', () => {
    freshenAfterMedia(cache, { ...NOTHING, changed: new Set(['one']) });

    expect(cache.getQueryState(['library', 'everything'])).toBeUndefined();

    cache.setQueryData(['library', 'everything', 'films'], []);
    freshenAfterMedia(cache, { ...NOTHING, changed: new Set(['one']) });

    expect(cache.getQueryState(['library', 'everything', 'films'])?.isInvalidated).toBe(true);
  });

  it('asks again for the named titles and the home page rows, and nothing else', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    freshenAfterMedia(cache, { ...NOTHING, changed: new Set(['one']) });

    const predicates = invalidate.mock.calls.flatMap(([asked]) =>
      asked?.predicate === undefined ? [] : [asked.predicate],
    );
    const query = (queryKey: readonly string[]) => {
      cache.setQueryData(queryKey, 'held');

      const found = cache.getQueryCache().find({ queryKey, exact: true });

      if (found === undefined) {
        throw new Error('The query was not held.');
      }

      return found;
    };
    const isAsked = (queryKey: readonly string[]) =>
      predicates.some((predicate) => predicate(query(queryKey)));

    expect(isAsked(['library', 'detail', 'one'])).toBe(true);
    expect(isAsked(['library', 'like-this', 'one'])).toBe(true);
    expect(isAsked(['library', 'across', 'films'])).toBe(true);
    expect(isAsked(['library', 'home-shelves', 'films'])).toBe(true);
    expect(isAsked(['library', 'detail', 'two'])).toBe(false);
    expect(isAsked(['library', 'everything', 'films'])).toBe(false);
  });

  it('throws away the collections when they changed', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);

    freshenAfterMedia(cache, { ...NOTHING, isCollections: true });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['collections'] });
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('throws away what is drawn from the likeness of titles when that was read again', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);

    freshenAfterMedia(cache, { ...NOTHING, isLikeness: true });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['viewing', 'because-you-watched'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['library', 'like-this'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['library', 'picked-for-you'] });
  });
});
