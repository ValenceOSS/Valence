import { renderHook } from '@testing-library/react-native';
import { THE_MARKS_PLACE } from '@ValencePhone/components/ACarriedMark/THE_MARKS_PLACE';
import { makeTheMarksWay } from '@ValencePhone/components/ACarriedMark/makeTheMarksWay';
import { useIsTheFirstMark } from './useIsTheFirstMark';
import type { ReactNode } from 'react';

describe('useIsTheFirstMark', () => {
  it('is the first where no mark has been shown, and not once one has', async () => {
    const way = makeTheMarksWay();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <THE_MARKS_PLACE.Provider value={way}>{children}</THE_MARKS_PLACE.Provider>
    );

    expect((await renderHook(() => useIsTheFirstMark(), { wrapper })).result.current).toBe(true);

    way.markShown();

    expect((await renderHook(() => useIsTheFirstMark(), { wrapper })).result.current).toBe(false);
  });
});
