import { describe, expect, it } from 'vitest';
import { isLocalTarget } from './isLocalTarget';

describe('isLocalTarget', () => {
  it('keeps a page on this site with the router', () => {
    expect(isLocalTarget({ to: '/tour' })).toBe(true);
  });

  it('lets a link that leaves the site go as a plain link', () => {
    expect(isLocalTarget({ href: 'https://docs.getvalence.app' })).toBe(false);
  });
});
