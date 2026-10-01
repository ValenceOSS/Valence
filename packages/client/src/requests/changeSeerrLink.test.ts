import { afterEach, describe, expect, it, vi } from 'vitest';
import { changeSeerrLink } from './changeSeerrLink';

const LINK = {
  isEnabled: true,
  apiKey: '0123456789abcdef0123456789abcdef',
  accountId: 'a1',
  isRequestingOn: true,
  radarrPath: '/arr/radarr',
  sonarrPath: '/arr/sonarr',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changeSeerrLink', () => {
  it('sends the change and reads the link back as saved', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(LINK)));

    vi.stubGlobal('fetch', fetching);

    expect((await changeSeerrLink({ isEnabled: true, accountId: 'a1' })).value).toEqual(LINK);
    expect(fetching).toHaveBeenCalledWith(
      '/api/requests/seerr',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ isEnabled: true, accountId: 'a1' }),
      }),
    );
  });

  it('says why it was refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: 'No such account.' }), { status: 400 }),
        ),
    );

    expect((await changeSeerrLink({ isEnabled: true, accountId: 'x' })).refusal?.message).toBe(
      'No such account.',
    );
  });
});
