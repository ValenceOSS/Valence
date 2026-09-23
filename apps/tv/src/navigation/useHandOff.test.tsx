import { createRef } from 'react';
import { View } from 'react-native';
import { act, render, renderHook } from '@testing-library/react-native';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import type { HWEvent } from 'react-native';

const mockRemote = new Set<(event: HWEvent) => void>();

jest.mock('react-native/Libraries/Components/TV/TVEventHandler', () => ({
  __esModule: true,
  default: {
    addListener: (listener: (event: HWEvent) => void) => {
      mockRemote.add(listener);

      return {
        remove: () => {
          mockRemote.delete(listener);
        },
      };
    },
  },
}));

const press = (eventType: string): void => {
  for (const listener of mockRemote) {
    listener({ eventType });
  }
};

const aTarget = async (): Promise<{ view: View; focus: jest.Mock }> => {
  const ref = createRef<View>();

  await render(<View ref={ref} />);

  const view = ref.current;

  if (view === null) {
    throw new Error('The view was not drawn');
  }

  const focus = jest.fn();

  view.requestTVFocus = focus;

  return { view, focus };
};

beforeEach(() => {
  jest.useFakeTimers();
  mockRemote.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useHandOff', () => {
  it('hands the remote over when it is pressed off the edge', async () => {
    const { view, focus } = await aTarget();
    const { result } = await renderHook(() => useHandOff('up', view));

    result.current.arrive();
    jest.advanceTimersByTime(200);
    await act(() => {
      press('up');
    });

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('does not carry on the press that brought the remote onto the edge', async () => {
    const { view, focus } = await aTarget();
    const { result } = await renderHook(() => useHandOff('up', view));

    result.current.arrive();
    press('up');

    expect(focus).not.toHaveBeenCalled();
  });

  it('ignores presses the other way, and presses once it has left the edge', async () => {
    const { view, focus } = await aTarget();
    const { result } = await renderHook(() => useHandOff('down', view));

    result.current.arrive();
    jest.advanceTimersByTime(200);
    press('up');
    result.current.leave();
    press('down');

    expect(focus).not.toHaveBeenCalled();
  });

  it('hands over only once for each arrival', async () => {
    const { view, focus } = await aTarget();
    const { result } = await renderHook(() => useHandOff('down', view));

    result.current.arrive();
    jest.advanceTimersByTime(200);
    press('down');
    press('down');

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('keeps the time of the first arrival while it stays on the edge', async () => {
    const { view, focus } = await aTarget();
    const { result } = await renderHook(() => useHandOff('down', view));

    result.current.arrive();
    jest.advanceTimersByTime(200);
    result.current.arrive();
    press('down');

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('leaves the television to find its own way where there is nothing to hand to', async () => {
    const { result } = await renderHook(() => useHandOff('up', null));

    result.current.arrive();
    jest.advanceTimersByTime(200);

    expect(() => {
      press('up');
    }).not.toThrow();
  });
});
