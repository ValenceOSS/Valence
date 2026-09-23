import { AccessibilityInfo } from 'react-native';
import { renderHook, waitFor } from '@testing-library/react-native';
import { usePrefersStillness } from './usePrefersStillness';

describe('usePrefersStillness', () => {
  it('moves things until the phone says somebody has asked for less motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const { result } = await renderHook(() => usePrefersStillness());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('keeps moving things for somebody who has not', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);

    const { result } = await renderHook(() => usePrefersStillness());

    expect(result.current).toBe(false);
  });
});
