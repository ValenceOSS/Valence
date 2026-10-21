import { QueryClient, hashKey } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aFakeKeptAnswers } from '@ValenceClient/testing/aFakeKeptAnswers';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { keepAnswers } from './keepAnswers';

const LIBRARIES = ['library', 'all'];

const HEALTH = ['admin', 'libraryHealth'];

const DAY_MS = 86_400_000;

let cache: QueryClient;
let stop: () => void = () => {};

const settled = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const keptLibraries = (updatedAt: number, data: object = [aLibrary()]) =>
  JSON.stringify({ updatedAt, data });

beforeEach(() => {
  cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
});

afterEach(() => {
  stop();
  cache.clear();
});

describe('keepAnswers', () => {
  it('writes each fresh answer to a kept query for the account signed in', async () => {
    const fake = aFakeKeptAnswers();

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await cache.fetchQuery({ queryKey: LIBRARIES, queryFn: () => [aLibrary()] });

    const written = fake.shelf.get('account-1')?.get(hashKey(LIBRARIES)) ?? '';

    expect(JSON.parse(written)).toMatchObject({ data: [{ name: 'Films' }] });
  });

  it('keeps nothing of a query that is not among the slow ones', async () => {
    const fake = aFakeKeptAnswers();

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await cache.fetchQuery({ queryKey: ['admin', 'overview'], queryFn: () => ({ any: 1 }) });

    expect(fake.shelf.size).toBe(0);
  });

  it('keeps nothing of a query that only starts like a kept one, such as one title’s files', async () => {
    const fake = aFakeKeptAnswers();

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await cache.fetchQuery({
      queryKey: ['requests', 'catalogue', 'film', '1', 'files'],
      queryFn: () => ({ files: [] }),
    });

    expect(fake.shelf.size).toBe(0);
  });

  it('shows a query already being asked what it answered last time, and marks it out of date', async () => {
    const fake = aFakeKeptAnswers();

    fake.put('account-1', hashKey(LIBRARIES), keptLibraries(Date.now() - 1000));
    cache.getQueryCache().build(cache, { queryKey: LIBRARIES });

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await settled();

    expect(cache.getQueryData(LIBRARIES)).toMatchObject([{ name: 'Films' }]);
    expect(cache.getQueryState(LIBRARIES)?.isInvalidated).toBe(true);
  });

  it('shows a query asked after the kept answers were read what it answered last time', async () => {
    const fake = aFakeKeptAnswers();

    fake.put('account-1', hashKey(LIBRARIES), keptLibraries(Date.now() - 1000));
    stop = keepAnswers(cache, 'account-1', fake.kept);
    await settled();

    cache.getQueryCache().build(cache, { queryKey: LIBRARIES });

    expect(cache.getQueryData(LIBRARIES)).toMatchObject([{ name: 'Films' }]);
  });

  it('leaves a query alone that the server has already answered', async () => {
    const fake = aFakeKeptAnswers();

    fake.put('account-1', hashKey(LIBRARIES), keptLibraries(Date.now() - 1000));
    cache.setQueryData(LIBRARIES, [aLibrary({ name: 'Newer' })]);

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await settled();

    expect(cache.getQueryData(LIBRARIES)).toMatchObject([{ name: 'Newer' }]);
  });

  it('shows nothing kept for somebody else', async () => {
    const fake = aFakeKeptAnswers();

    fake.put('account-2', hashKey(LIBRARIES), keptLibraries(Date.now() - 1000));
    cache.getQueryCache().build(cache, { queryKey: LIBRARIES });

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await settled();

    expect(cache.getQueryData(LIBRARIES)).toBeUndefined();
  });

  it('shows nothing that no longer reads as the answer, as after an upgrade changes its shape', async () => {
    const fake = aFakeKeptAnswers();

    fake.put('account-1', hashKey(HEALTH), JSON.stringify({ updatedAt: Date.now(), data: [1] }));
    fake.put('account-1', hashKey(LIBRARIES), 'not json');
    cache.getQueryCache().build(cache, { queryKey: HEALTH });
    cache.getQueryCache().build(cache, { queryKey: LIBRARIES });

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await settled();

    expect(cache.getQueryData(HEALTH)).toBeUndefined();
    expect(cache.getQueryData(LIBRARIES)).toBeUndefined();
  });

  it('shows nothing kept for longer than a month', async () => {
    const fake = aFakeKeptAnswers();

    fake.put('account-1', hashKey(LIBRARIES), keptLibraries(Date.now() - 31 * DAY_MS));
    cache.getQueryCache().build(cache, { queryKey: LIBRARIES });

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await settled();

    expect(cache.getQueryData(LIBRARIES)).toBeUndefined();
  });

  it('does not write back what it has just shown', async () => {
    const fake = aFakeKeptAnswers();
    const text = keptLibraries(Date.now() - 1000);

    fake.put('account-1', hashKey(LIBRARIES), text);
    cache.getQueryCache().build(cache, { queryKey: LIBRARIES });

    stop = keepAnswers(cache, 'account-1', fake.kept);
    await settled();

    expect(fake.shelf.get('account-1')?.get(hashKey(LIBRARIES))).toBe(text);
  });

  it('keeps nothing more once it is stopped', async () => {
    const fake = aFakeKeptAnswers();

    keepAnswers(cache, 'account-1', fake.kept)();
    await cache.fetchQuery({ queryKey: LIBRARIES, queryFn: () => [aLibrary()] });

    expect(fake.shelf.size).toBe(0);
  });
});
