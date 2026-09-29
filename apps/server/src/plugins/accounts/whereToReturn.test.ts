import { describe, expect, it } from 'vitest';
import { BACK_IN_THE_APP } from '@ValenceContracts/constants/BACK_IN_THE_APP';
import { whereToReturn } from './whereToReturn';

describe('whereToReturn', () => {
  it('keeps a path on this server', () => {
    expect(whereToReturn('/?account=plugin.anilist-sync.settings')).toBe(
      '/?account=plugin.anilist-sync.settings',
    );
  });

  it('hands a phone back to the app', () => {
    expect(whereToReturn(BACK_IN_THE_APP)).toBe(BACK_IN_THE_APP);
  });

  it('goes home when nothing was asked for', () => {
    expect(whereToReturn(undefined)).toBe('/');
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'valence://signed-in?code=stolen',
    `${BACK_IN_THE_APP}?then=https://evil.example`,
    '',
  ])('refuses %s', (asked) => {
    expect(whereToReturn(asked)).toBe('/');
  });
});
