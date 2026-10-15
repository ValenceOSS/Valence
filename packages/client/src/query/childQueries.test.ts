import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { childQueries } from './childQueries';

const fetchChildren = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/account/fetchChildren', () => ({ fetchChildren }));

const aCache = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

beforeEach(() => {
  vi.clearAllMocks();

  fetchChildren.mockResolvedValue([]);
});

describe('childQueries', () => {
  it('asks for the children this account looks after', async () => {
    await expect(aCache().fetchQuery(childQueries.all())).resolves.toEqual([]);
  });

  it('sits under its own key', () => {
    expect(childQueries.all().queryKey.slice(0, 1)).toEqual(childQueries.key);
  });
});
