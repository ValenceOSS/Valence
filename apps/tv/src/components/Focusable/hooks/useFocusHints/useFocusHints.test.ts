import { renderHook } from '@testing-library/react-native';
import { useFocusHints } from '@ValenceTv/components/Focusable/hooks/useFocusHints/useFocusHints';

describe('useFocusHints', () => {
  it('says where the remote starts and where right goes through the television’s own props', async () => {
    const ref = jest.fn();
    const { result } = await renderHook(() => useFocusHints(ref, true, { right: null }));

    expect(result.current.ref).toBe(ref);
    expect(result.current.hints).toEqual({ hasTVPreferredFocus: true, nextFocusRight: null });
  });

  it('says where down and up go too, where it is told', async () => {
    const { result } = await renderHook(() =>
      useFocusHints(undefined, false, { down: null, up: null }),
    );

    expect(result.current.hints).toEqual({
      hasTVPreferredFocus: false,
      nextFocusDown: null,
      nextFocusUp: null,
    });
  });

  it('leaves right to the television where nothing says otherwise', async () => {
    const { result } = await renderHook(() => useFocusHints(undefined, false));

    expect(result.current.hints).toEqual({ hasTVPreferredFocus: false });
  });
});
