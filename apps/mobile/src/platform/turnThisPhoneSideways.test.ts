import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { settleTheOrientation } from './settleTheOrientation';
import { turnThisPhoneSideways } from './turnThisPhoneSideways';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';

beforeEach(() => {
  holdAWindowOf(393, 852);
  jest.mocked(lockAsync).mockReset().mockResolvedValue();
});

describe('turnThisPhoneSideways', () => {
  it('turns the phone, rather than waiting to be asked', async () => {
    const letGo = turnThisPhoneSideways();

    await settleTheOrientation(0);

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.LANDSCAPE);

    letGo();
  });

  it('allows either way round, so nobody has to hold it the one way', async () => {
    const letGo = turnThisPhoneSideways();

    await settleTheOrientation(0);

    expect(lockAsync).not.toHaveBeenCalledWith(OrientationLock.LANDSCAPE_LEFT);

    letGo();
  });

  it('turns it back upright once it is let go', async () => {
    turnThisPhoneSideways()();

    await settleTheOrientation(0);

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.PORTRAIT_UP);
  });

  it('stays sideways when let go and taken again at once, as a refreshed screen does', async () => {
    turnThisPhoneSideways()();
    const letGo = turnThisPhoneSideways();

    await settleTheOrientation(0);

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.LANDSCAPE);

    letGo();
  });
});
