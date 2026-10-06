import { describe, expect, it, vi } from 'vitest';
import { staysInTheApplication } from './staysInTheApplication';

vi.mock('@ValenceDesktop/main/serveTheApplication', () => ({ ORIGIN: 'valence://app' }));

describe('staysInTheApplication', () => {
  it('keeps the application’s own pages', () => {
    expect(staysInTheApplication('valence://app/')).toBe(true);
    expect(staysInTheApplication('valence://app/watch/abc?at=12')).toBe(true);
  });

  it.each([
    ['a site of somebody else’s', 'https://example.com/'],
    ['the server itself', 'http://192.168.1.40:8420/'],
    ['another host on the same scheme', 'valence://elsewhere/'],
    ['a script', 'javascript:alert(1)'],
    ['a file on the machine', 'file:///etc/passwd'],
    ['a page made from its own address', 'data:text/html,<p>hi</p>'],
    ['something that is not an address', 'not an address'],
  ])('refuses %s', (_what, url) => {
    expect(staysInTheApplication(url)).toBe(false);
  });
});
