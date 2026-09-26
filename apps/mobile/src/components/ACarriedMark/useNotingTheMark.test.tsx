import { renderHook } from '@testing-library/react-native';
import { THE_MARKS_PLACE } from '@ValenceMobile/components/ACarriedMark/THE_MARKS_PLACE';
import { makeTheMarksWay } from '@ValenceMobile/components/ACarriedMark/makeTheMarksWay';
import { useNotingTheMark } from './useNotingTheMark';
import type { ReactNode } from 'react';

const aPlacedMark = () => ({
  measureInWindow: (told: (x: number, y: number, width: number, height: number) => void) => {
    told(10, 20, 100, 40);
  },
});

describe('useNotingTheMark', () => {
  it('notes the mark as shown, and hands on where it sat when it goes', async () => {
    const way = makeTheMarksWay();
    const leave = jest.spyOn(way, 'leave');
    const { result, unmount } = await renderHook(() => useNotingTheMark(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <THE_MARKS_PLACE.Provider value={way}>{children}</THE_MARKS_PLACE.Provider>
      ),
    });

    result.current(aPlacedMark());

    expect(way.hasShown()).toBe(true);

    await unmount();

    expect(leave).toHaveBeenCalledWith({ x: 10, y: 20, width: 100, height: 40 });
  });
});
