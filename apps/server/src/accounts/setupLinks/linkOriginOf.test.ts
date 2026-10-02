import { describe, expect, it } from 'vitest';
import { linkOriginOf } from './linkOriginOf';

const TRUSTED = ['https://valence.example', 'valence://app'];

describe('linkOriginOf', () => {
  it('builds on the browser’s own origin where it is trusted', () => {
    expect(linkOriginOf(new Headers({ origin: 'https://valence.example' }), TRUSTED)).toBe(
      'https://valence.example',
    );
  });

  it('ignores an origin nobody trusts', () => {
    expect(
      linkOriginOf(new Headers({ origin: 'https://elsewhere.example' }), TRUSTED),
    ).toBeUndefined();
  });

  it('ignores the desktop client, whose links would not open in a browser', () => {
    expect(linkOriginOf(new Headers({ origin: 'valence://app' }), TRUSTED)).toBeUndefined();
  });

  it('has nothing to go on without an origin', () => {
    expect(linkOriginOf(new Headers(), TRUSTED)).toBeUndefined();
  });
});
