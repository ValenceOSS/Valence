import { describe, expect, it } from 'vitest';
import { isAskedByMe } from './isAskedByMe';

const REQUEST = {
  requestedBy: { id: 'a', name: 'Priya', askingProfile: { profileId: 'p-kid', name: 'Kid' } },
  alsoAskedBy: [{ id: 'b', name: 'Sam', askingProfile: { profileId: 'p-sam', name: 'Sam' } }],
  origin: 'asked' as const,
};

describe('isAskedByMe', () => {
  it('holds for the profile that asked first and for one that joined', () => {
    expect(isAskedByMe(REQUEST, { accountId: 'a', profileId: 'p-kid' })).toBe(true);
    expect(isAskedByMe(REQUEST, { accountId: 'b', profileId: 'p-sam' })).toBe(true);
  });

  it('holds for nobody else on an asking account, only its profile that asked', () => {
    expect(isAskedByMe(REQUEST, { accountId: 'a', profileId: 'p-parent' })).toBe(false);
  });

  it('holds for nobody on another account, nor for nobody', () => {
    expect(isAskedByMe(REQUEST, { accountId: 'c', profileId: 'p-kid' })).toBe(false);
    expect(isAskedByMe(REQUEST, null)).toBe(false);
  });

  it('holds for any profile on an account that asked before profiles were told apart', () => {
    const request = { ...REQUEST, requestedBy: { id: 'a', name: 'Priya' } };

    expect(isAskedByMe(request, { accountId: 'a', profileId: 'p-parent' })).toBe(true);
  });

  it('holds for nobody on a title only followed', () => {
    expect(
      isAskedByMe(
        { ...REQUEST, alsoAskedBy: [], origin: 'monitored' },
        { accountId: 'a', profileId: 'p-kid' },
      ),
    ).toBe(false);
  });
});
