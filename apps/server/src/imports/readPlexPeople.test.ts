import { describe, expect, it } from 'vitest';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import { createPlexTvCaller } from './createPlexTvCaller';
import { readFixture } from './readFixture';
import { readPlexPeople } from './readPlexPeople';

describe('readPlexPeople', () => {
  it('reads the owner, Home and friends on this server, with their tokens and shared libraries', async () => {
    const files: Record<string, string> = {
      '/api/v2/user': 'plextv-user.xml',
      '/api/home/users': 'plextv-home-users.xml',
      '/api/users/': 'plextv-users.xml',
      '/api/servers/abc123machine/shared_servers': 'plextv-shared-servers.xml',
    };
    const { fetch } = aFakeSourceFetch(({ url }) => {
      const name = files[url.pathname];

      return name === undefined ? null : { body: readFixture(name) };
    });
    const people = await readPlexPeople(createPlexTvCaller(fetch, 't', 'c'), 'abc123machine');

    expect(
      people.map((person) => [person.id, person.isOwner, person.isHome, person.isProtected]),
    ).toEqual([
      ['1111', true, true, false],
      ['2222', false, true, true],
      ['3333', false, true, false],
      ['4444', false, false, false],
    ]);
    expect(people[3]).toMatchObject({
      name: 'Friend Fran',
      sharedToken: 'fran-server-token',
      libraryKeys: ['1'],
      filterMovies: 'contentRating=G%2CPG%2CPG-13',
    });
    expect(people[1]?.restrictionProfile).toBe('older_kid');
    expect(people[1]?.username).toBeNull();
  });

  it('still reads the owner where the lists of others cannot be read', async () => {
    const { fetch } = aFakeSourceFetch(({ url }) =>
      url.pathname === '/api/v2/user'
        ? { body: readFixture('plextv-user.xml') }
        : { status: 500, body: '' },
    );
    const people = await readPlexPeople(createPlexTvCaller(fetch, 't', 'c'), 'm');

    expect(people.map((person) => person.id)).toEqual(['1111']);
  });
});
