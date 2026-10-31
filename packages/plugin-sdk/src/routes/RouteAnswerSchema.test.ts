import { describe, expect, it } from 'vitest';
import { RouteAnswerSchema } from './RouteAnswerSchema';

describe('RouteAnswerSchema', () => {
  it('reads an answer with a body, and one asking Valence to serve something', () => {
    expect(
      RouteAnswerSchema.parse({ status: 200, contentType: 'application/json', body: '{}' }),
    ).toEqual({ status: 200, contentType: 'application/json', body: '{}' });
    expect(RouteAnswerSchema.parse({ serve: { kind: 'track', mediaId: 'm1' } })).toEqual({
      serve: { kind: 'track', mediaId: 'm1', quality: 'lossless' },
    });
    expect(RouteAnswerSchema.parse({ serve: { kind: 'albumArtwork', albumId: 'a1' } })).toEqual({
      serve: { kind: 'albumArtwork', albumId: 'a1' },
    });
  });

  it('refuses a page, a script, a picture or anything else a browser could run or draw', () => {
    for (const contentType of [
      'text/html',
      'application/javascript',
      'image/svg+xml',
      'application/xhtml+xml',
      'text/html; charset=utf-8',
    ]) {
      expect(
        RouteAnswerSchema.safeParse({ status: 200, contentType, body: '<script></script>' })
          .success,
      ).toBe(false);
    }
  });

  it('refuses headers of its own, a redirect or an empty status, and a serve it does not know', () => {
    expect(
      RouteAnswerSchema.safeParse({
        status: 200,
        contentType: 'text/plain',
        body: '',
        headers: { 'set-cookie': 'a=b' },
      }).success,
    ).toBe(false);
    for (const status of [204, 302, 304, 600]) {
      expect(
        RouteAnswerSchema.safeParse({ status, contentType: 'text/plain', body: '' }).success,
      ).toBe(false);
    }
    expect(
      RouteAnswerSchema.safeParse({ serve: { kind: 'file', path: '/etc/passwd' } }).success,
    ).toBe(false);
  });
});
