import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';
import { saveProfileDraft } from './saveProfileDraft';

const saveProfile = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));
const uploadProfilePhoto = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));

vi.mock('@ValenceClient/profiles/fetchProfiles', () => ({ saveProfile, uploadProfilePhoto }));

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DRAFT: ProfileDraft = {
  name: '  Dan  ',
  colour: '#3ac47d',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 2,
  showsWhatIamWatching: true,
  photo: null,
};

const PHOTO = new File(['bytes'], 'face.png', { type: 'image/png' });

beforeEach(() => {
  saveProfile.mockReset().mockResolvedValue(true);
  uploadProfilePhoto.mockReset().mockResolvedValue(true);
});

describe('saveProfileDraft', () => {
  it('writes the draft without the spaces around its name, and sends no photo it has not got', async () => {
    expect(await saveProfileDraft(PROFILE, DRAFT)).toBe(true);

    expect(uploadProfilePhoto).not.toHaveBeenCalled();
    expect(saveProfile).toHaveBeenCalledWith(
      PROFILE.id,
      'Dan',
      '#3ac47d',
      { kind: 'initial', font: 'gilroy' },
      2,
      true,
    );
  });

  it('keeps the old name where the new one was left empty', async () => {
    await saveProfileDraft(PROFILE, { ...DRAFT, name: '   ' });

    expect(saveProfile).toHaveBeenCalledWith(
      PROFILE.id,
      'Marques',
      '#3ac47d',
      { kind: 'initial', font: 'gilroy' },
      2,
      true,
    );
  });

  it('sends a new photo first', async () => {
    expect(await saveProfileDraft(PROFILE, { ...DRAFT, photo: PHOTO })).toBe(true);

    expect(uploadProfilePhoto).toHaveBeenCalledWith(PROFILE.id, PHOTO);
    expect(saveProfile).toHaveBeenCalledOnce();
  });

  it('writes nothing else when the photo could not be sent', async () => {
    uploadProfilePhoto.mockResolvedValue(false);

    expect(await saveProfileDraft(PROFILE, { ...DRAFT, photo: PHOTO })).toBe(false);
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it('says so when the rest could not be written', async () => {
    saveProfile.mockResolvedValue(false);

    expect(await saveProfileDraft(PROFILE, DRAFT)).toBe(false);
  });
});
