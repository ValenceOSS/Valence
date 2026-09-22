import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { turnThisPhoneSideways } from './turnThisPhoneSideways';

beforeEach(() => {
  jest.mocked(lockAsync).mockReset().mockResolvedValue();
});

describe('turnThisPhoneSideways', () => {
  it('turns the phone, rather than waiting to be asked', async () => {
    await turnThisPhoneSideways();

    expect(lockAsync).toHaveBeenCalledWith(OrientationLock.LANDSCAPE);
  });

  it('allows either way round, so nobody has to hold it the one way', async () => {
    await turnThisPhoneSideways();

    expect(lockAsync).not.toHaveBeenCalledWith(OrientationLock.LANDSCAPE_LEFT);
  });

  it('carries on where the phone would not be told', async () => {
    jest.mocked(lockAsync).mockRejectedValue(new Error('no'));

    await expect(turnThisPhoneSideways()).resolves.toBeUndefined();
  });
});
