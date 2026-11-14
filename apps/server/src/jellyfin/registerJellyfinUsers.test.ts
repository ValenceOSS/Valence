import { describe, expect, it } from 'vitest';
import { aJellyfinServer } from './testing/aJellyfinServer';

describe('registerJellyfinUsers', () => {
  it('sign in and hand back a token, a user and a session', async () => {
    const { post } = aJellyfinServer();
    const answer = await post(
      '/Users/AuthenticateByName',
      { Username: 'marnie', Pw: 'correct' },
      null,
    );

    expect(answer.status).toBe(200);
    expect(await answer.json()).toMatchObject({
      AccessToken: 's.a-session',
      User: { Name: 'Marnie' },
      SessionInfo: { Client: 'Findroid', DeviceName: 'Pixel 8' },
    });
  });

  it('pass on a refused sign-in with its status', async () => {
    const { post } = aJellyfinServer();
    const answer = await post('/Users/AuthenticateByName', { username: 'm', pw: 'no' }, null);

    expect(answer.status).toBe(401);
    expect((await post('/Users/AuthenticateByName', { nothing: 1 }, null)).status).toBe(400);
  });

  it('refuse everything else without a token Valence knows', async () => {
    const { ask } = aJellyfinServer();

    expect((await ask('/Users/Me', { token: 's.unknown' })).status).toBe(401);
    expect((await ask('/Items', { token: null })).status).toBe(401);
  });

  it('send a profile’s picture as its user’s', async () => {
    const { ask } = aJellyfinServer();
    const answer = await ask('/Users/02791fd985474c78898b00fe47b60627/Images/Primary', {
      token: null,
    });

    expect(await answer.text()).toBe('face');
  });

  it('sign out of the session the token stands for', async () => {
    const { post, recorded } = aJellyfinServer();

    expect((await post('/Sessions/Logout', {})).status).toBe(204);
    expect(recorded.signedOut).toBe(1);
  });
});
