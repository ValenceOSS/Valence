import { describe, expect, it } from 'vitest';
import { pickTheAccountsFace } from './pickTheAccountsFace';
import type { StoredFace } from './pickTheAccountsFace';

const EARLIER = new Date('2026-01-01T00:00:00.000Z');

const LATER = new Date('2026-06-01T00:00:00.000Z');

const nothing = (updatedAt = EARLIER): StoredFace => ({
  photoPath: null,
  avatarStyle: null,
  avatarSeed: null,
  updatedAt,
});

const photograph = (path: string, updatedAt = LATER): StoredFace => ({
  ...nothing(updatedAt),
  photoPath: path,
});

const drawn = (style: string, updatedAt = LATER): StoredFace => ({
  ...nothing(updatedAt),
  avatarStyle: style,
  avatarSeed: 'seed',
});

describe('pickTheAccountsFace', () => {
  it('draws the picture put on the account', () => {
    expect(pickTheAccountsFace(photograph('household.png'), nothing())).toEqual(
      photograph('household.png'),
    );
  });

  it('draws the picture put on the account ahead of the one on the profile', () => {
    expect(pickTheAccountsFace(photograph('household.png'), photograph('profile.png'))).toEqual(
      photograph('household.png'),
    );
  });

  it('keeps a picture set before accounts had one of their own', () => {
    expect(pickTheAccountsFace(nothing(), photograph('profile.png'))).toEqual(
      photograph('profile.png'),
    );
  });

  it('keeps the profile picture where the account has no household row at all', () => {
    expect(pickTheAccountsFace(null, photograph('profile.png'))).toEqual(photograph('profile.png'));
  });

  it('draws a face the account was given rather than a photograph', () => {
    expect(pickTheAccountsFace(drawn('bottts'), nothing())).toEqual(drawn('bottts'));
  });

  it('passes over a style nothing can draw', () => {
    expect(pickTheAccountsFace(drawn('oil-painting'), photograph('profile.png'))).toEqual(
      photograph('profile.png'),
    );
  });

  it('passes over a drawn face missing the seed it is drawn from', () => {
    const half: StoredFace = { ...nothing(), avatarStyle: 'bottts' };

    expect(pickTheAccountsFace(half, photograph('profile.png'))).toEqual(photograph('profile.png'));
  });

  it('leaves an initial where neither holds a face', () => {
    expect(pickTheAccountsFace(nothing(LATER), nothing(EARLIER))).toEqual(nothing(EARLIER));
  });

  it('carries the time the face it picked was last changed', () => {
    expect(
      pickTheAccountsFace(photograph('household.png', LATER), nothing(EARLIER)).updatedAt,
    ).toBe(LATER);

    expect(pickTheAccountsFace(nothing(LATER), photograph('profile.png', EARLIER)).updatedAt).toBe(
      EARLIER,
    );
  });
});
