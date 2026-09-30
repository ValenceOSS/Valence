import { afterEach, describe, expect, it, vi } from 'vitest';
import { GIVE_UP_DEFAULTS } from '@ValenceContracts/schemas/GiveUpRules';
import { changeGiveUpRules, fetchGiveUpRules } from './fetchGiveUpRules';

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchGiveUpRules', () => {
  it('reads the rules', async () => {
    answering(GIVE_UP_DEFAULTS);

    expect(await fetchGiveUpRules()).toEqual(GIVE_UP_DEFAULTS);
  });
});

describe('changeGiveUpRules', () => {
  it('sends the rules whole, and reads them back as kept', async () => {
    const rules = { ...GIVE_UP_DEFAULTS, slowDays: null };
    const fetchMock = answering(rules);

    expect((await changeGiveUpRules(rules)).value).toEqual(rules);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/requests/give-up-rules');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT');
  });

  it('says why they were refused', async () => {
    answering({ error: 'Those are not rules for giving up on a download.' }, 400);

    expect((await changeGiveUpRules(GIVE_UP_DEFAULTS)).refusal?.message).toBe(
      'Those are not rules for giving up on a download.',
    );
  });
});
