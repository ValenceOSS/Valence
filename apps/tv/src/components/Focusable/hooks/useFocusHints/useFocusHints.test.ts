import { renderHook } from '@testing-library/react-native';
import { useFocusHints } from '@ValenceTv/components/Focusable/hooks/useFocusHints/useFocusHints';

describe('useFocusHints', () => {
  it('says where the remote starts and where right goes through the television’s own props', async () => {
    const ref = jest.fn();
    const { result } = await renderHook(() => useFocusHints(ref, true, null));

    expect(result.current.ref).toBe(ref);
    expect(result.current.hints).toEqual({ hasTVPreferredFocus: true, nextFocusRight: null });
  });

  it('leaves right to the television where nothing says otherwise', async () => {
    const { result } = await renderHook(() => useFocusHints(undefined, false, undefined));

    expect(result.current.hints).toEqual({ hasTVPreferredFocus: false });
  });
});
