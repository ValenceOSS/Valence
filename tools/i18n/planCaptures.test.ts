import { describe, expect, it } from 'vitest';
import { planCaptures } from './planCaptures';

describe('planCaptures', () => {
  it('visits every web and desktop screen at its address', () => {
    expect(
      planCaptures(
        {
          'web.home': { client: 'web', route: '/', reach: 'The home page.' },
          'desktop.menu': { client: 'desktop', route: '/admin', reach: 'The admin page.' },
        },
        {},
      ).visits,
    ).toEqual([
      { id: 'desktop.menu', path: '/admin', press: [] },
      { id: 'web.home', path: '/', press: [] },
    ]);
  });

  it('leaves out what a phone, a television or the server draws', () => {
    expect(
      planCaptures(
        {
          'phone.home': { client: 'phone', route: 'Library/Home', reach: 'The first tab.' },
          'tv.home': { client: 'tv', route: 'Home', reach: 'The first screen.' },
          'server.discord': { client: 'server', route: 'discord', reach: 'A Discord post.' },
        },
        {},
      ),
    ).toEqual({ visits: [], unfilled: [] });
  });

  it('fills an address in from what is given, and names those it cannot fill', () => {
    expect(
      planCaptures(
        {
          'web.watch': { client: 'web', route: '/watch/$mediaId', reach: 'Playing a film.' },
          'web.read': { client: 'web', route: '/read/$bookId', reach: 'Reading a book.' },
        },
        { mediaId: 'abc' },
      ),
    ).toEqual({
      visits: [{ id: 'web.watch', path: '/watch/abc', press: [] }],
      unfilled: ['web.read'],
    });
  });

  it('carries what to press once there, to open a dialog or a menu', () => {
    expect(
      planCaptures(
        {
          'web.downloads': {
            client: 'web',
            route: '/',
            reach: 'The downloads panel.',
            press: ['Downloads'],
          },
        },
        {},
      ).visits,
    ).toEqual([{ id: 'web.downloads', path: '/', press: ['Downloads'] }]);
  });
});
