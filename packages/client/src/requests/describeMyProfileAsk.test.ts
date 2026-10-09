import { describe, expect, it } from 'vitest';
import { describeMyProfileAsk } from './describeMyProfileAsk';

const UHD = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const HD = '3fa85f64-5717-4562-b3fc-2c963f66afa7';

const REQUEST = {
  alsoAskedBy: [{ id: 'me', name: 'Me', profileId: UHD, profileName: 'UHD 4K' }],
  profileAsk: null,
  profileId: HD,
  profileName: 'HD 1080p',
};

describe('describeMyProfileAsk', () => {
  it('says the profile asked at was kept to the request’s own', () => {
    expect(describeMyProfileAsk(REQUEST, 'me')).toBe(
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
        'me',
      ),
    ).toBe('You asked for UHD 4K. An admin will decide which quality it’s fetched in.');
  });

  it('says nothing where the profile asked at is kept as a further version', () => {
    expect(describeMyProfileAsk({ ...REQUEST, versions: [UHD] }, 'me')).toBeNull();
  });

  it('says nothing where somebody got what they asked for, or asked at no profile', () => {
    expect(describeMyProfileAsk({ ...REQUEST, profileId: UHD }, 'me')).toBeNull();
    expect(describeMyProfileAsk(REQUEST, 'someone-else')).toBeNull();
  });
});
