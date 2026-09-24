import { renderHook } from '@testing-library/react-native';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { useIsOnTop } from './useIsOnTop';
import type { ReactNode } from 'react';

describe('useIsOnTop', () => {
  it('counts a page that is not in a stack as on top', async () => {
    const { result } = await renderHook(() => useIsOnTop());

    expect(result.current).toBe(true);
  });

  it('says a page beneath another is not on top', async () => {
    const { result } = await renderHook(() => useIsOnTop(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <IS_ON_TOP.Provider value={false}>{children}</IS_ON_TOP.Provider>
      ),
    });

    expect(result.current).toBe(false);
  });
});
