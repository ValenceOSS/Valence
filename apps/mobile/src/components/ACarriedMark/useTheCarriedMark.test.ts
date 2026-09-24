import { renderHook } from '@testing-library/react-native';
import { useTheCarriedMark } from './useTheCarriedMark';

describe('useTheCarriedMark', () => {
  it('keeps the mark unseen until it has landed', async () => {
    const { result } = await renderHook(() => useTheCarriedMark());

    expect(JSON.stringify(result.current.shown)).toBe('0');
    expect(result.current.placed.current).toBeNull();
  });
});
