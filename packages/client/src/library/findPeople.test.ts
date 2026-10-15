import { afterEach, describe, expect, it, vi } from 'vitest';
import { findPeople } from './findPeople';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('findPeople', () => {
  it('asks the server for the people whose names match', async () => {
    const amy = { personId: 1, name: 'Amy Adams', imageUrl: null, titleCount: 2 };
    const fetch = vi.fn((_address: string) =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ people: [amy] }) }),
    );

    vi.stubGlobal('fetch', fetch);

    await expect(findPeople(' amy adams ')).resolves.toEqual([amy]);
    expect(String(fetch.mock.calls[0]?.[0] ?? '')).toContain('/api/people?search=amy+adams');
  });

  it('asks nothing for an empty search', async () => {
    const fetch = vi.fn();

    vi.stubGlobal('fetch', fetch);

    await expect(findPeople('  ')).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
