import { describe, expect, it } from 'vitest';
import { groupSameFilms } from './groupSameFilms';
import type { FilmOnDisk } from './groupSameFilms';

const film = (id: string, path: string, overrides: Partial<FilmOnDisk> = {}): FilmOnDisk => ({
  id,
  path,
  externalId: '4327',
  parentId: null,
  versionLabel: null,
  ...overrides,
});

describe('groupSameFilms', () => {
  it('makes films the catalogue says are one film into versions of it, whatever they are called', () => {
    expect(
      groupSameFilms([
        film('cut', "/films/Charlie's Angels (2000)/Charlie's Angels (2000) - Extended Cut.mkv"),
        film('bluray', "/films/Charlie's Angels (2000)/Charlie's Angels (2000) Bluray-1080p.mkv"),
      ]),
    ).toEqual([
      { id: 'cut', parentId: 'bluray', versionLabel: 'Extended Cut' },
      { id: 'bluray', parentId: null, versionLabel: 'Bluray-1080p' },
    ]);
  });

  it('leaves films the catalogue says are different alone', () => {
    expect(
      groupSameFilms([
        film('alien', '/films/Alien (1979).mkv', { externalId: '348' }),
        film('aliens', '/films/Aliens (1986).mkv', { externalId: '679' }),
      ]),
    ).toEqual([]);
  });

  it('keeps the film that already stands for the others standing, unnamed where it adds nothing', () => {
    expect(
      groupSameFilms([
        film('main', '/films/Heat/Heat.mkv', { versionLabel: null }),
        film('dc', '/films/Heat/Heat - Director’s Cut.mkv', {
          parentId: 'main',
          versionLabel: 'Director’s Cut',
        }),
        film('uhd', '/elsewhere/Heat 2160p.mkv'),
      ]),
    ).toEqual([{ id: 'uhd', parentId: 'main', versionLabel: '2160p' }]);
  });

  it('says nothing more once films are already grouped as they should be', () => {
    expect(
      groupSameFilms([
        film('a', '/films/Heat 1080p.mkv', { versionLabel: '1080p' }),
        film('b', '/films/Heat 2160p.mkv', { parentId: 'a', versionLabel: '2160p' }),
      ]),
    ).toEqual([]);
  });

  it('lets a version go once it is matched to a different film than the one it hangs from', () => {
    expect(
      groupSameFilms([
        film('heat', '/films/Heat.mkv', { externalId: '949' }),
        film('other', '/films/Heat - Other.mkv', {
          externalId: '1234',
          parentId: 'heat',
          versionLabel: 'Other',
        }),
      ]),
    ).toEqual([{ id: 'other', parentId: null, versionLabel: null }]);
  });
});
