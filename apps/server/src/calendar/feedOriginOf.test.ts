import { describe, expect, it } from 'vitest';
import { feedOriginOf } from './feedOriginOf';

describe('feedOriginOf', () => {
  it('takes the address the feed was asked for at', () => {
    expect(feedOriginOf('http://192.168.1.36:3000/api/calendar/feed/x.ics', new Headers())).toBe(
      'http://192.168.1.36:3000',
    );
  });

  it('takes the scheme and host a reverse proxy says it was asked over', () => {
    expect(
      feedOriginOf(
        'http://valence:3000/api/calendar/feed/x.ics',
        new Headers({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'valence.example' }),
      ),
    ).toBe('https://valence.example');
  });

  it('ignores a scheme that is not one a browser opens', () => {
    expect(
      feedOriginOf(
        'http://valence:3000/api/calendar/feed/x.ics',
        new Headers({ 'x-forwarded-proto': 'javascript' }),
      ),
    ).toBe('http://valence:3000');
  });
});
