import { describe, expect, it } from 'vitest';
import { whereTo } from './whereTo';

describe('whereTo', () => {
  it('keeps a page on this site with the site’s own link', () => {
    expect(whereTo({ site: 'landing', path: '/tour' }, 'landing')).toStrictEqual({
      isOnSite: true,
      to: '/tour',
    });
  });

  it('leads to a page on a sister site by its whole address', () => {
    expect(whereTo({ site: 'landing', path: '/tour' }, 'metrics')).toStrictEqual({
      isOnSite: false,
      href: 'https://getvalence.app/tour',
    });
    expect(whereTo({ site: 'metrics', path: '/' }, 'landing')).toStrictEqual({
      isOnSite: false,
      href: 'https://metrics.getvalence.app',
    });
  });

  it('lets a link that leaves Valence go as a plain link', () => {
    expect(whereTo({ href: 'https://discord.gg/x' }, 'landing')).toStrictEqual({
      isOnSite: false,
      href: 'https://discord.gg/x',
    });
  });
});
