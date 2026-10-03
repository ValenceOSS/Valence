import { describe, expect, it } from 'vitest';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { draftOfProfile } from './draftOfProfile';

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: true,
  prefersBestCopy: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('draftOfProfile', () => {
  it('reads every editable part of a profile, with no photo waiting to be sent', () => {
    expect(draftOfProfile(PROFILE)).toEqual({
      name: 'Marques',
      colour: '#3a8ee8',
      avatar: { kind: 'initial', font: 'gilroy' },
      askStillWatchingAfter: 4,
      showsWhatIamWatching: true,
      prefersBestCopy: false,
      photo: null,
    });
  });
});
