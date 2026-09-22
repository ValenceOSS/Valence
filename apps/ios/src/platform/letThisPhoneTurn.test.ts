import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { letThisPhoneTurn } from './letThisPhoneTurn';

beforeEach(() => {
  jest.mocked(lockAsync).mockReset().mockResolvedValue();
});

describe('letThisPhoneTurn', () => {
  it('allows every way up, rather than choosing one for them', async () => {
    await letThisPhoneTurn();

    expect(lockAsync).toHaveBeenCalledWith(OrientationLock.ALL);
  });

  it('carries on where the phone would not be told', async () => {
    jest.mocked(lockAsync).mockRejectedValue(new Error('no'));

    await expect(letThisPhoneTurn()).resolves.toBeUndefined();
  });
});
