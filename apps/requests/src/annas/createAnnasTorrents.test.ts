import { describe, expect, it, vi } from 'vitest';
import { createAnnasTorrents } from './createAnnasTorrents';

const LIST = [
  {
    group_name: 'libgen_rs_fic',
    display_name: 'f_381000.torrent',
    url: '/dyn/small_file/f.torrent',
    obsolete: false,
    seeders: 3,
  },
  {
    group_name: 'libgen_li_fic',
    display_name: 'f_381000.torrent',
    url: '/dyn/small_file/g.torrent',
    obsolete: true,
    seeders: 0,
  },
];

describe('createAnnasTorrents', () => {
  it('finds a torrent by its group and name, leaving out those no longer offered', async () => {
    const fetch = vi.fn(() => Promise.resolve(Response.json(LIST)));
    const torrents = createAnnasTorrents(fetch);

    expect(await torrents.find('https://example.org', 'libgen_rs_fic', 'f_381000.torrent')).toEqual(
      {
        group: 'libgen_rs_fic',
        name: 'f_381000.torrent',
        url: 'https://example.org/dyn/small_file/f.torrent',
        seeders: 3,
      },
    );
    expect(
      await torrents.find('https://example.org', 'libgen_li_fic', 'f_381000.torrent'),
    ).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('asks again once a day has passed', async () => {
    let at = 0;
    const fetch = vi.fn(() => Promise.resolve(Response.json(LIST)));
    const torrents = createAnnasTorrents(fetch, () => at);

    await torrents.all('https://example.org');
    at = 25 * 60 * 60 * 1000;
    await torrents.all('https://example.org');

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('drops a torrent whose file is named on any other host than the mirror', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        Response.json([
          { ...LIST[0], url: 'http://10.0.0.5:8080/steal.torrent' },
          { ...LIST[0], display_name: 'g.torrent', url: '//other.example/x.torrent' },
        ]),
      ),
    );
    const torrents = createAnnasTorrents(fetch);

    expect((await torrents.all('https://example.org')).size).toBe(0);
  });
});
