import { describe, expect, it } from 'vitest';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { faceOfAskable } from './faceOfAskable';

describe('faceOfAskable', () => {
  it('draws somebody from this server as their profile does', () => {
    const avatar = { kind: 'drawn', style: 'lorelei', seed: 'dan' } as const;

    expect(
      faceOfAskable({
        id: 'dan',
        name: 'Dan',
        colour: PROFILE_COLOURS[2],
        avatar,
        updatedAt: '2026-11-15T10:00:00.000Z',
      }),
    ).toEqual({
      id: 'dan',
      name: 'Dan',
      colour: PROFILE_COLOURS[2],
      avatar,
      updatedAt: '2026-11-15T10:00:00.000Z',
    });
  });

  it('reads a household’s face from where the server keeps its picture', () => {
    expect(
      faceOfAskable({
        id: 'owner',
        name: 'The Ones',
        avatar: { kind: 'photo', isVideo: false, frame: null, hasFramedPicture: true },
        updatedAt: '2026-11-15T10:00:00.000Z',
        pictureUrl: '/api/profiles/owner/household?v=1',
      }).pictureUrl,
    ).toBe('/api/profiles/owner/household?v=1');
  });

  it('draws somebody from a linked server by their initial', () => {
    expect(faceOfAskable({ id: 'peer~films~kai', name: 'Kai from Films' })).toMatchObject({
      name: 'Kai from Films',
      colour: PROFILE_COLOURS[0],
      avatar: { kind: 'initial' },
    });
  });
});
