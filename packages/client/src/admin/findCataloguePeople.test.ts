import { afterEach, describe, expect, it, vi } from 'vitest';
import { findCataloguePeople } from './findCataloguePeople';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('findCataloguePeople', () => {
  it('asks the server to look in the catalogue for the name typed', async () => {
    const person = { personId: 1, name: 'An actor', imageUrl: null, knownFor: null };
    const fetch = vi.fn((_address: string) =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ people: [person] }) }),
    );

    vi.stubGlobal('fetch', fetch);

    await expect(findCataloguePeople(' an actor ')).resolves.toEqual([person]);
    expect(String(fetch.mock.calls[0]?.[0] ?? '')).toContain(
      '/api/admin/titles/people?name=an+actor',
    );
  });

  it('asks nothing for an empty name', async () => {
    const fetch = vi.fn();

    vi.stubGlobal('fetch', fetch);

    await expect(findCataloguePeople('  ')).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
