import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { theIdleStatus } from './theIdleStatus';

beforeEach(() => {
  document.documentElement.dataset['valenceDesktop'] = 'true';
});

afterEach(() => {
  delete document.documentElement.dataset['valenceDesktop'];
});

describe('theIdleStatus', () => {
  it('says somebody is browsing, with how they want it to look', () => {
    expect(theIdleStatus(true, { ...DEFAULT_DISCORD_PRESENCE, logo: 'dark' })).toMatchObject({
      kind: 'browsing',
      look: { logo: 'dark' },
    });
  });

  it('says nothing where browsing is turned off, or nothing is shown at all', () => {
    expect(theIdleStatus(true, { ...DEFAULT_DISCORD_PRESENCE, showsBrowsing: false })).toBeNull();
    expect(theIdleStatus(false, DEFAULT_DISCORD_PRESENCE)).toBeNull();
  });

  it('says nothing in a browser, which has no window to say it to', () => {
    delete document.documentElement.dataset['valenceDesktop'];

    expect(theIdleStatus(true, DEFAULT_DISCORD_PRESENCE)).toBeNull();
  });
});
