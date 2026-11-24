import { act, renderHook } from '@testing-library/react-native';
import { thePhonesVolume } from '@ValenceMobile/platform/thePhonesVolume';
import { useVolumeButtons } from '@ValenceMobile/hooks/useVolumeButtons';

const mockListeners = new Set<(change: object) => void>();

jest.mock('@ValenceMobile/platform/thePhonesVolume', () => ({
  thePhonesVolume: {
    now: jest.fn(() => 0.75),
    set: jest.fn(() => Promise.resolve()),
    hearTheButtons: jest.fn(),
    addListener: jest.fn((_event: string, listener: (change: object) => void) => {
      mockListeners.add(listener);

      return {
        remove: () => {
          mockListeners.delete(listener);
        },
      };
    }),
  },
}));

const phone = jest.mocked(thePhonesVolume);

const pressedTo = async (volume: number): Promise<void> => {
  await act(async () => {
    mockListeners.forEach((listener) => {
      listener({ volume });
    });
    await Promise.resolve();
  });
};

beforeEach(() => {
  mockListeners.clear();
  jest.mocked(phone?.now)?.mockReturnValue(0.75);
  jest.mocked(phone?.set)?.mockClear();
  jest.mocked(phone?.hearTheButtons)?.mockClear();
});

describe('useVolumeButtons', () => {
  it('tells how far each press of the buttons turned it', async () => {
    const onTurn = jest.fn();

    await renderHook(() => {
      useVolumeButtons(true, onTurn);
    });

    await pressedTo(0.8125);
    await pressedTo(0.75);

    expect(onTurn.mock.calls.map(([by]: [number]) => Math.round(by * 10_000) / 10_000)).toEqual([
      0.0625, -0.0625,
    ]);
    expect(phone?.hearTheButtons).toHaveBeenCalledWith(true);
  });

  it('puts the phone back in the middle at an end, so a press there is still heard', async () => {
    jest.mocked(phone?.now)?.mockReturnValue(1);
    const onTurn = jest.fn();

    await renderHook(() => {
      useVolumeButtons(true, onTurn);
    });

    expect(phone?.set).toHaveBeenCalledWith(0.5);

    await pressedTo(0.5);

    expect(onTurn).not.toHaveBeenCalled();

    await pressedTo(0.5625);

    expect(onTurn).toHaveBeenCalledTimes(1);
  });

  it('puts the phone back where it was once it stops listening', async () => {
    const { unmount } = await renderHook(() => {
      useVolumeButtons(true, jest.fn());
    });

    await unmount();

    expect(phone?.set).toHaveBeenLastCalledWith(0.75);
    expect(phone?.hearTheButtons).toHaveBeenLastCalledWith(false);
    expect(mockListeners.size).toBe(0);
  });

  it('leaves the buttons to the phone while it is not asked to listen', async () => {
    const onTurn = jest.fn();

    await renderHook(() => {
      useVolumeButtons(false, onTurn);
    });

    await pressedTo(0.8125);

    expect(onTurn).not.toHaveBeenCalled();
    expect(phone?.hearTheButtons).not.toHaveBeenCalled();
  });
});
