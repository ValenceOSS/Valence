import { act, fireEvent, render } from '@testing-library/react-native';
import { TheTelevisionsVolume } from './TheTelevisionsVolume';

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
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('TheTelevisionsVolume', () => {
  it('turns the television up as far as a press of the phone’s button would turn the phone', async () => {
    const onTurn = jest.fn();

    await render(<TheTelevisionsVolume level={0.5} onTurn={onTurn} />);

    await pressedTo(0.8125);
    await pressedTo(0.875);

    expect(onTurn.mock.calls.map(([to]: [number]) => Math.round(to * 10_000) / 10_000)).toEqual([
      0.5625, 0.625,
    ]);
  });

  it('turns the television from its slider', async () => {
    const onTurn = jest.fn();
    const drawn = await render(<TheTelevisionsVolume level={0.5} onTurn={onTurn} />);

    await act(async () => {
      fireEvent(drawn.getByRole('adjustable', { name: 'Volume' }), 'accessibilityAction', {
        nativeEvent: { actionName: 'decrement' },
      });
      await Promise.resolve();
    });

    expect(onTurn).toHaveBeenCalledWith(0);
  });

  it('shows what it was turned to until the television says so', async () => {
    const drawn = await render(<TheTelevisionsVolume level={1} onTurn={jest.fn()} />);

    await act(async () => {
      fireEvent(drawn.getByRole('adjustable', { name: 'Volume' }), 'accessibilityAction', {
        nativeEvent: { actionName: 'decrement' },
      });
      await Promise.resolve();
    });

    expect(drawn.getByRole('adjustable', { name: 'Volume', value: { now: 0 } })).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3_000);
      await Promise.resolve();
    });

    expect(drawn.getByRole('adjustable', { name: 'Volume', value: { now: 1 } })).toBeTruthy();
  });
});
