import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { settleTheOrientation } from './settleTheOrientation';

beforeEach(() => {
  jest.mocked(lockAsync).mockReset().mockResolvedValue();
});

describe('settleTheOrientation', () => {
  it('turns the phone sideways while anything has asked for that', async () => {
    await settleTheOrientation(1);

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.LANDSCAPE);

    await settleTheOrientation(-1);
  });

  it('holds it upright once every ask has been let go', async () => {
    void settleTheOrientation(1);
    void settleTheOrientation(1);
    void settleTheOrientation(-1);
    await settleTheOrientation(-1);

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.PORTRAIT_UP);
  });

  it('turns the phone one way at a time, so the last ask wins', async () => {
    let finishFirst: () => void = () => undefined;

    jest.mocked(lockAsync).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishFirst = resolve;
      }),
    );

    const first = settleTheOrientation(1);
    const second = settleTheOrientation(-1);

    await Promise.resolve();

    expect(lockAsync).toHaveBeenCalledTimes(1);

    finishFirst();
    await Promise.all([first, second]);

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.PORTRAIT_UP);
  });

  it('never counts below nobody asking', async () => {
    await settleTheOrientation(-1);
    await settleTheOrientation(1);

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.LANDSCAPE);

    await settleTheOrientation(-1);
  });

  it('carries on where the phone would not be told', async () => {
    jest.mocked(lockAsync).mockRejectedValue(new Error('no'));

    await expect(settleTheOrientation(0)).resolves.toBeUndefined();
  });
});
