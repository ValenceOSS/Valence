import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { holdThisPhoneUpright } from './holdThisPhoneUpright';
import { turnThisPhoneSideways } from './turnThisPhoneSideways';

beforeEach(() => {
  jest.mocked(lockAsync).mockReset().mockResolvedValue();
});

describe('holdThisPhoneUpright', () => {
  it('keeps the phone the way up somebody is holding it', async () => {
    await holdThisPhoneUpright();

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.PORTRAIT_UP);
  });

  it('leaves a phone sideways while a film has it', async () => {
    const letGo = turnThisPhoneSideways();

    await holdThisPhoneUpright();

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.LANDSCAPE);

    letGo();
  });

  it('carries on where the phone would not be told', async () => {
    jest.mocked(lockAsync).mockRejectedValue(new Error('no'));

    await expect(holdThisPhoneUpright()).resolves.toBeUndefined();
  });
});
