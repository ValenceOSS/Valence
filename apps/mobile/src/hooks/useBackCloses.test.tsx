import { renderHook } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { useBackCloses } from './useBackCloses';

type Answer = Parameters<typeof BackHandler.addEventListener>[1];

const answering: Answer[] = [];

const PRESSED = { type: 'hardwareBackPress', timeStamp: 0 };

/**
 * Presses Android's back button, as the system does: newest answer first, until one takes it.
 *
 * @returns Whether anything took it.
 */
const pressBack = (): boolean =>
  [...answering].reverse().some((answer) => answer(PRESSED) === true);

beforeEach(() => {
  answering.length = 0;
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, answer) => {
    answering.push(answer);

    return {
      remove: () => {
        answering.splice(answering.indexOf(answer), 1);
      },
    };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useBackCloses', () => {
  it('closes what is open when back is pressed, and takes the press', async () => {
    const close = jest.fn();

    await renderHook(() => {
      useBackCloses(true, close);
    });

    expect(pressBack()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('leaves the press alone while nothing is open', async () => {
    const close = jest.fn();

    await renderHook(() => {
      useBackCloses(false, close);
    });

    expect(pressBack()).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('stops answering once it is closed', async () => {
    const close = jest.fn();
    const { rerender } = await renderHook(
      ({ isOpen }: { isOpen: boolean }) => {
        useBackCloses(isOpen, close);
      },
      { initialProps: { isOpen: true } },
    );

    await rerender({ isOpen: false });

    expect(pressBack()).toBe(false);
  });
});
