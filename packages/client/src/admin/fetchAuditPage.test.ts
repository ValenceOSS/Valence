import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAuditPage } from './fetchAuditPage';

const PAGE = {
  entries: [
    {
      id: 'one',
      at: '2026-10-22T03:00:00.000Z',
      actorId: null,
      actorName: '',
      action: 'auth.signInFailed',
      target: 'tom@example.com',
      detail: { method: 'password' },
      address: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
    },
  ],
  nextCursor: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAuditPage', () => {
  it('asks for only what narrows the log, and reads the page back', async () => {
    const fetched = vi.fn((_url: string) => Promise.resolve(new Response(JSON.stringify(PAGE))));

    vi.stubGlobal('fetch', fetched);

    await expect(
      fetchAuditPage(
        { category: 'auth', search: ' tom ', sinceMs: 5, order: 'oldest' },
        'cursor-1',
      ),
    ).resolves.toEqual(PAGE);

    const asked = new URL(fetched.mock.calls[0]?.[0] ?? '', 'http://localhost');

    expect(Object.fromEntries(asked.searchParams)).toEqual({
      category: 'auth',
      search: 'tom',
      sinceMs: '5',
      order: 'oldest',
      cursor: 'cursor-1',
    });
  });

  it('leaves out the newest-first order and an empty search, which are what is asked for anyway', async () => {
    const fetched = vi.fn((_url: string) => Promise.resolve(new Response(JSON.stringify(PAGE))));

    vi.stubGlobal('fetch', fetched);

    await fetchAuditPage({ search: '  ', order: 'newest' });

    expect(fetched.mock.calls[0]?.[0]).toBe('/api/admin/audit?');
  });
});
