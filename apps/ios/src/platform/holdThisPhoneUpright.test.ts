import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { holdThisPhoneUpright } from './holdThisPhoneUpright';

beforeEach(() => {
  jest.mocked(lockAsync).mockReset().mockResolvedValue();
});

describe('holdThisPhoneUpright', () => {
  it('keeps the phone the way up somebody is holding it', async () => {
    await holdThisPhoneUpright();

    expect(lockAsync).toHaveBeenCalledWith(OrientationLock.PORTRAIT_UP);
  });

  it('carries on where the phone would not be told', async () => {
    jest.mocked(lockAsync).mockRejectedValue(new Error('no'));

    await expect(holdThisPhoneUpright()).resolves.toBeUndefined();
  });
});
