import { QueryClient, QueryClientProvider, hashKey } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeKeptAnswers } from '@ValenceClient/testing/aFakeKeptAnswers';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { useKeptAnswers } from './useKeptAnswers';
import type { SessionUser } from '@ValenceContracts/schemas/Session';
import type { ReactNode } from 'react';

const fetchSession = vi.hoisted(() => vi.fn<() => Promise<SessionUser | null>>());

vi.mock('@ValenceClient/session/auth', () => ({ fetchSession }));

const LIBRARIES = ['library', 'all'];

const AN_ADMIN: SessionUser = {
  id: 'account-1',
  name: 'Admin',
  email: null,
  emailVerified: false,
};

let cache: QueryClient;

const keeping = () =>
  renderHook(
    () => {
      useKeptAnswers();
    },
    {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: cache }, children),
    },
  );

beforeEach(() => {
  cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
});

afterEach(() => {
  forgetPlatform();
  cache.clear();
});

describe('useKeptAnswers', () => {
  it('keeps the slow answers for whoever is signed in', async () => {
    const fake = aFakeKeptAnswers();

    installPlatform(aFakePlatform({ kept: fake.kept }));
    fetchSession.mockResolvedValue(AN_ADMIN);
    keeping();

    await waitFor(() => {
      expect(cache.getQueryData(['session', 'who'])).toBeDefined();
    });
    await cache.fetchQuery({ queryKey: LIBRARIES, queryFn: () => [aLibrary()] });

    await waitFor(() => {
      expect(fake.shelf.get('account-1')?.has(hashKey(LIBRARIES))).toBe(true);
    });
  });

  it('keeps nothing while nobody is signed in', async () => {
    const fake = aFakeKeptAnswers();

    installPlatform(aFakePlatform({ kept: fake.kept }));
    fetchSession.mockResolvedValue(null);
    keeping();

    await waitFor(() => {
      expect(cache.getQueryState(['session', 'who'])?.status).toBe('success');
    });
    await cache.fetchQuery({ queryKey: LIBRARIES, queryFn: () => [aLibrary()] });

    expect(fake.shelf.size).toBe(0);
  });

  it('does nothing on a client with nowhere to keep them', async () => {
    installPlatform(aFakePlatform());
    fetchSession.mockResolvedValue(AN_ADMIN);
    keeping();

    await waitFor(() => {
      expect(cache.getQueryData(['session', 'who'])).toBeDefined();
    });

    await expect(
      cache.fetchQuery({ queryKey: LIBRARIES, queryFn: () => [aLibrary()] }),
    ).resolves.toHaveLength(1);
  });
});
