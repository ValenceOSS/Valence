import { describe, expect, it } from 'vitest';
import { pathOnThisServer } from './pathOnThisServer';

describe('pathOnThisServer', () => {
  it('keeps a path on this server', () => {
    expect(pathOnThisServer('/?account=plugin.anilist-sync.settings')).toBe(
      '/?account=plugin.anilist-sync.settings',
    );
  });

  it('goes home when nothing was asked for', () => {
    expect(pathOnThisServer(undefined)).toBe('/');
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', ''])(
    'refuses %s',
    (asked) => {
      expect(pathOnThisServer(asked)).toBe('/');
    },
  );
});
