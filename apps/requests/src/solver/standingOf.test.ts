import { describe, expect, it } from 'vitest';
import { standingOf } from './standingOf';

describe('standingOf', () => {
  it('lets an ordinary page through', () => {
    expect(standingOf(200, 'cloudflare', '<title>Search</title>')).toBe('clear');
  });

  it('knows the browser check', () => {
    expect(standingOf(403, 'cloudflare', '<title>Just a moment...</title>')).toBe('challenged');
  });

  it('knows a refusal no browser gets past', () => {
    expect(
      standingOf(
        403,
        'cloudflare',
        '<title>Attention Required! | Cloudflare</title><h1>Sorry, you have been blocked</h1>',
      ),
    ).toBe('blocked');
  });

  it('takes a refusal that did not come from Cloudflare for the site’s own', () => {
    expect(standingOf(403, 'nginx', 'you have been blocked')).toBe('clear');
    expect(standingOf(404, 'cloudflare', 'cf-error-details')).toBe('clear');
  });
});
