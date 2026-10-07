import { AccessibilityInfo } from 'react-native';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';

describe('useKeepsStill', () => {
  it('keeps still where somebody asked the television for less motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const { result } = await renderHook(() => useKeepsStill());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('moves things where nobody did', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);

    const { result } = await renderHook(() => useKeepsStill());

    expect(result.current).toBe(false);
  });
});
