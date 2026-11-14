import { describe, expect, it } from 'vitest';
import { jellyfinLinks } from './jellyfinLinks';
import { aFakeStore } from './testing/aFakeStore';

const LINK = {
  address: 'http://jellyfin.test',
  serverId: 's',
  serverName: 'Den',
  token: 't',
  userId: 'u',
  userName: 'marnie',
  isAdministrator: false,
};

describe('jellyfinLinks', () => {
  it('keeps a link by its address, and forgets it', () => {
    const links = jellyfinLinks(aFakeStore());

    links.keep(LINK);

    expect(links.of('http://jellyfin.test')).toEqual(LINK);
    expect(links.of('http://elsewhere.test')).toBeNull();
    expect(links.of(null)).toBeNull();

    links.forget('http://jellyfin.test');

    expect(links.of('http://jellyfin.test')).toBeNull();
  });

  it('reads nothing from a store holding something else', () => {
    const store = aFakeStore();

    store.write('valence.jellyfin.links', 'not json');

    expect(jellyfinLinks(store).of('http://jellyfin.test')).toBeNull();
  });
});
