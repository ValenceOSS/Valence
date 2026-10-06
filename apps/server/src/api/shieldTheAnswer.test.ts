import { describe, expect, it } from 'vitest';
import { shieldTheAnswer } from './shieldTheAnswer';

const shielded = (init: Record<string, string> = {}) => {
  const headers = new Headers(init);

  shieldTheAnswer(headers);

  return headers;
};

describe('shieldTheAnswer', () => {
  it('names no page, asks not to be indexed, and is never read as another kind of file', () => {
    const headers = shielded({ 'content-type': 'application/json' });

    expect(headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('may be framed by this server alone, unless whatever answered said otherwise', () => {
    expect(shielded().get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(shielded({ 'x-frame-options': 'DENY' }).get('X-Frame-Options')).toBe('DENY');
  });

  it('sandboxes a drawing, and leaves a policy already set alone', () => {
    expect(shielded({ 'content-type': 'image/svg+xml' }).get('Content-Security-Policy')).toContain(
      'sandbox',
    );
    expect(
      shielded({
        'content-type': 'image/svg+xml',
        'content-security-policy': "default-src 'none'",
      }).get('Content-Security-Policy'),
    ).toBe("default-src 'none'");
    expect(shielded({ 'content-type': 'text/html' }).has('Content-Security-Policy')).toBe(false);
  });
});
