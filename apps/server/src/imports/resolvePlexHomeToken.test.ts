import { describe, expect, it } from 'vitest';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import { createPlexTvCaller } from './createPlexTvCaller';
import { readFixture } from './readFixture';
import { resolvePlexHomeToken } from './resolvePlexHomeToken';
import { SourceFailure } from './SourceFailure';

/**
 * What resolving a token threw, as the code it said.
 *
 * @param resolving - The attempt.
 * @returns The code.
 */
const codeOf = async (resolving: Promise<string>) =>
  resolving.then(
    () => 'resolved',
    (error) => (error instanceof SourceFailure ? error.said.code : 'other'),
  );

describe('resolvePlexHomeToken', () => {
  it('switches to the member with their PIN and reads their token for this server', async () => {
    const { fetch, calls } = aFakeSourceFetch(({ url }) =>
      url.pathname === '/api/v2/resources'
        ? { body: readFixture('plextv-resources.xml') }
        : { body: readFixture('plextv-switch.xml') },
    );

    expect(
      await resolvePlexHomeToken(
        createPlexTvCaller(fetch, 'owner', 'c'),
        'abc123machine',
        '2222',
        '1234',
      ),
    ).toBe('ash-server-token');
    expect(calls[0]).toMatchObject({ method: 'POST' });
    expect(calls[0]?.url.searchParams.get('pin')).toBe('1234');
    expect(calls[1]?.headers['X-Plex-Token']).toBe('ash-account-token');
  });

  it('says the PIN was wrong when plex.tv refuses it', async () => {
    const { fetch } = aFakeSourceFetch(() => ({ status: 401, body: '' }));

    expect(
      await codeOf(resolvePlexHomeToken(createPlexTvCaller(fetch, 'o', 'c'), 'm', '2222', '0000')),
    ).toBe('server.imports.resolvePlexHomeToken.thatPinWasNotRight');
  });

  it('passes on a plex.tv that is down', async () => {
    const { fetch } = aFakeSourceFetch(() => ({ status: 503, body: '' }));

    expect(
      await codeOf(resolvePlexHomeToken(createPlexTvCaller(fetch, 'o', 'c'), 'm', '2222', null)),
    ).toBe('server.imports.sourceCaller.nameAnsweredStatusAtPath');
  });

  it('says so where plex.tv gives no token, or the server is not theirs', async () => {
    const noToken = aFakeSourceFetch(() => ({ body: '<user id="2"/>' }));
    const notShared = aFakeSourceFetch(({ url }) =>
      url.pathname === '/api/v2/resources'
        ? { body: '<resources/>' }
        : { body: readFixture('plextv-switch.xml') },
    );

    expect(
      await codeOf(
        resolvePlexHomeToken(createPlexTvCaller(noToken.fetch, 'o', 'c'), 'm', '2', null),
      ),
    ).toBe('server.imports.resolvePlexHomeToken.plexDidNotLetValenceIn');
    expect(
      await codeOf(
        resolvePlexHomeToken(createPlexTvCaller(notShared.fetch, 'o', 'c'), 'm', '2', null),
      ),
    ).toBe('server.imports.resolvePlexHomeToken.thisServerIsNotSharedWithThem');
  });
});
