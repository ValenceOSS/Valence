import { describe, expect, it } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { facePictureOf } from './facePictureOf';

const aProfile = (avatar: ViewerProfile['avatar']): ViewerProfile => ({
  id: '176acd29-9b53-4193-831d-291bc7a9d4eb',
  name: 'Dan',
  colour: '#e8503a',
  avatar,
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  language: null,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-09-22T10:00:00.000Z',
});

describe('facePictureOf', () => {
  it('has no picture for an initial', () => {
    expect(
      facePictureOf(aProfile({ kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED })),
    ).toBeNull();
  });

  it('reads a drawn face from the drawing, which needs nobody signed in, on its colour where it has one', () => {
    expect(facePictureOf(aProfile({ kind: 'drawn', style: 'lorelei', seed: 'dan' }))).toEqual({
      path: '/api/profiles/avatars/lorelei?seed=dan',
      isDrawn: true,
    });
    expect(
      facePictureOf(aProfile({ kind: 'drawn', style: 'lorelei', seed: 'dan', isOnColour: true }))
        ?.path,
    ).toBe('/api/profiles/avatars/lorelei?seed=dan&colour=%23e8503a');
  });

  it('reads a photograph, an orb and a sketch from the picture the server keeps', () => {
    expect(
      facePictureOf(
        aProfile({ kind: 'photo', isVideo: false, frame: null, hasFramedPicture: false }),
      ),
    ).toEqual({
      path: '/api/profiles/176acd29-9b53-4193-831d-291bc7a9d4eb/avatar?v=2026-09-22T10%3A00%3A00.000Z',
      isDrawn: false,
    });
    expect(
      facePictureOf(aProfile({ kind: 'orb', orb: 'glow', params: {}, colours: {} }))?.path,
    ).toContain('/avatar?v=');
  });

  it('asks for the square the server framed, where it frames them', () => {
    expect(
      facePictureOf(
        aProfile({ kind: 'photo', isVideo: false, frame: null, hasFramedPicture: true }),
      )?.path,
    ).toMatch(/[?&]framed=1$/u);
  });

  it('reads a household face from the address the server gave it', () => {
    expect(
      facePictureOf({
        ...aProfile({ kind: 'photo', isVideo: false, frame: null, hasFramedPicture: false }),
        pictureUrl: '/api/profiles/one/household?v=1',
      })?.path,
    ).toBe('/api/profiles/one/household?v=1');
  });

  it('gives way to the initial for a photograph that moves', () => {
    expect(
      facePictureOf(
        aProfile({ kind: 'photo', isVideo: true, frame: null, hasFramedPicture: false }),
      ),
    ).toBeNull();
  });
});
