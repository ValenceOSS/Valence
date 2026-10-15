import { describe, expect, it } from 'vitest';
import { describeMyProfileAsk } from './describeMyProfileAsk';

const UHD = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const HD = '3fa85f64-5717-4562-b3fc-2c963f66afa7';

const KID = { id: 'me', name: 'Me', askingProfile: { profileId: 'p-kid', name: 'Kid' } };
const PARENT = { id: 'me', name: 'Me', askingProfile: { profileId: 'p-parent', name: 'Parent' } };

const REQUEST = {
  alsoAskedBy: [{ id: 'me', name: 'Me', profileId: UHD, profileName: 'UHD 4K' }],
  profileAsk: null,
  profileId: HD,
  profileName: 'HD 1080p',
};

describe('describeMyProfileAsk', () => {
  it('says the profile asked at was kept to the request’s own', () => {
    expect(describeMyProfileAsk(REQUEST, { accountId: 'me', profileId: null })).toBe(
      'You asked for UHD 4K · it’s being fetched with HD 1080p',
    );
  });

  it('says an admin has still to decide', () => {
    expect(
      describeMyProfileAsk(
        {
          ...REQUEST,
          profileAsk: {
            asker: { id: 'me', name: 'Me' },
            profileId: UHD,
            profileName: 'UHD 4K',
          },
        },
        { accountId: 'me', profileId: null },
      ),
    ).toBe('You asked for UHD 4K. An admin will decide which quality it’s fetched in.');
  });

  it('says nothing where the profile asked at is kept as a further version', () => {
    expect(
      describeMyProfileAsk({ ...REQUEST, versions: [UHD] }, { accountId: 'me', profileId: null }),
    ).toBeNull();
  });

  it('says nothing where somebody got what they asked for, or asked at no profile', () => {
    expect(
      describeMyProfileAsk({ ...REQUEST, profileId: UHD }, { accountId: 'me', profileId: null }),
    ).toBeNull();
    expect(
      describeMyProfileAsk(REQUEST, { accountId: 'someone-else', profileId: null }),
    ).toBeNull();
  });

  it('tells two profiles on one account apart, each by what it asked for', () => {
    const request = {
      ...REQUEST,
      alsoAskedBy: [
        { ...KID, profileId: UHD, profileName: 'UHD 4K' },
        { ...PARENT, profileId: HD, profileName: 'HD 1080p' },
      ],
    };

    expect(describeMyProfileAsk(request, { accountId: 'me', profileId: 'p-kid' })).toBe(
      'You asked for UHD 4K · it’s being fetched with HD 1080p',
    );
    expect(describeMyProfileAsk(request, { accountId: 'me', profileId: 'p-parent' })).toBeNull();
  });

  it('takes an ask recorded without a profile as any profile’s on its account', () => {
    expect(describeMyProfileAsk(REQUEST, { accountId: 'me', profileId: 'p-kid' })).toBe(
      'You asked for UHD 4K · it’s being fetched with HD 1080p',
    );
  });

  it('says an admin has still to decide only to the profile whose ask is waiting', () => {
    const request = {
      ...REQUEST,
      alsoAskedBy: [
        { ...KID, profileId: UHD, profileName: 'UHD 4K' },
        { ...PARENT, profileId: UHD, profileName: 'UHD 4K' },
      ],
      profileAsk: { asker: KID, profileId: UHD, profileName: 'UHD 4K' },
    };

    expect(describeMyProfileAsk(request, { accountId: 'me', profileId: 'p-kid' })).toBe(
      'You asked for UHD 4K. An admin will decide which quality it’s fetched in.',
    );
    expect(describeMyProfileAsk(request, { accountId: 'me', profileId: 'p-parent' })).toBe(
      'You asked for UHD 4K · it’s being fetched with HD 1080p',
    );
  });
});
