import { renderHook } from '@testing-library/react-native';
import { useRemoteRing } from '@ValenceTv/remote/useRemoteRing';
import type * as UseRemoteRing from '@ValenceTv/remote/useRemoteRing';
import type * as TestingLibrary from '@testing-library/react-native/pure';

type Turn = { degrees: number };

const mockTurns = new Set<(turn: Turn) => void>();

const mockRing = { start: jest.fn(), stop: jest.fn() };

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => ({
    start: () => {
      mockRing.start();
    },
    stop: () => {
      mockRing.stop();
    },
    addListener: (_event: string, listener: (turn: Turn) => void) => {
      mockTurns.add(listener);

      return {
        remove: () => {
          mockTurns.delete(listener);
        },
      };
    },
  }),
}));

const turn = (degrees: number): void => {
  for (const listener of mockTurns) {
    listener({ degrees });
  }
};

beforeEach(() => {
  mockTurns.clear();
  mockRing.start.mockClear();
  mockRing.stop.mockClear();
});

describe('useRemoteRing', () => {
  it('tells how far the thumb has turned while listening', async () => {
    const onTurn = jest.fn();

    await renderHook(() => {
      useRemoteRing(true, onTurn);
    });

    turn(15);

    expect(mockRing.start).toHaveBeenCalledTimes(1);
    expect(onTurn).toHaveBeenCalledWith(15);
  });

  it('follows nothing while not listening', async () => {
    const onTurn = jest.fn();

    await renderHook(() => {
      useRemoteRing(false, onTurn);
    });

    turn(15);

    expect(mockRing.start).not.toHaveBeenCalled();
    expect(onTurn).not.toHaveBeenCalled();
  });

  it('stops following once it is no longer wanted', async () => {
    const { rerender } = await renderHook(
      ({ isListening }: { isListening: boolean }) => {
        useRemoteRing(isListening, jest.fn());
      },
      { initialProps: { isListening: true } },
    );

    await rerender({ isListening: false });

    expect(mockRing.stop).toHaveBeenCalledTimes(1);
    expect(mockTurns.size).toBe(0);
  });

  it('tells the latest listener without starting the ring again', async () => {
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = await renderHook(
      ({ onTurn }: { onTurn: (degrees: number) => void }) => {
        useRemoteRing(true, onTurn);
      },
      { initialProps: { onTurn: first } },
    );

    await rerender({ onTurn: latest });
    turn(-10);

    expect(mockRing.start).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith(-10);
  });

  it('hears nothing where the remote cannot report its ring', async () => {
    jest.resetModules();
    jest.doMock('expo', () => ({
      ...jest.requireActual<object>('expo'),
      requireOptionalNativeModule: () => null,
    }));

    const { useRemoteRing: withoutTheRing } = jest.requireActual<typeof UseRemoteRing>(
      '@ValenceTv/remote/useRemoteRing',
    );

    const { renderHook: renderAfresh } = jest.requireActual<typeof TestingLibrary>(
      '@testing-library/react-native/pure',
    );

    const { unmount } = await renderAfresh(() => {
      withoutTheRing(true, jest.fn());
    });

    expect(mockRing.start).not.toHaveBeenCalled();

    await unmount();
  });
});
