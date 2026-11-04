import { describe, expect, it } from 'vitest';
import { faceBeforeAnyProfile } from './faceBeforeAnyProfile';
import { ViewerProfileSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';
import type { Household } from '@ValenceContracts/schemas/Household';

const FACE: Household = {
  name: 'Pat',
  colour: '#3ac47d',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  updatedAt: '2026-11-04T12:00:00.000Z',
};

describe('faceBeforeAnyProfile', () => {
  it('draws the account under its way-in id, with its own name and picture', () => {
    const face = faceBeforeAnyProfile(
      '8d0c2f3e-6f5b-4c0e-9a51-3f1e2d4c5b6a',
      FACE,
      '2026-11-01T09:00:00.000Z',
    );

    expect(face).toMatchObject({
      id: '8d0c2f3e-6f5b-4c0e-9a51-3f1e2d4c5b6a',
      name: 'Pat',
      colour: '#3ac47d',
      isOwner: true,
      createdAt: '2026-11-01T09:00:00.000Z',
      pictureUrl:
        '/api/profiles/8d0c2f3e-6f5b-4c0e-9a51-3f1e2d4c5b6a/household?v=2026-11-04T12%3A00%3A00.000Z',
    });
  });

  it('cuts an account name longer than a profile may hold, so the apps can still read it', () => {
    const face = faceBeforeAnyProfile(
      '8d0c2f3e-6f5b-4c0e-9a51-3f1e2d4c5b6a',
      { ...FACE, name: 'The household at the end of the long road' },
      '2026-11-01T09:00:00.000Z',
    );

    expect(ViewerProfileSchema.safeParse(face).success).toBe(true);
  });

  it('is a profile the apps can read', () => {
    expect(
      ViewerProfileSchema.safeParse(
        faceBeforeAnyProfile(
          '8d0c2f3e-6f5b-4c0e-9a51-3f1e2d4c5b6a',
          FACE,
          '2026-11-01T09:00:00.000Z',
        ),
      ).success,
    ).toBe(true);
  });
});
