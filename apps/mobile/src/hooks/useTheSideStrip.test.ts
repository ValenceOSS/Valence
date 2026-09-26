import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheSideStrip } from '@ValenceMobile/hooks/useTheSideStrip';
import { whereTheStatusIs } from '@ValenceMobile/platform/whereTheStatusIs';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: jest.fn() }));

jest.mock('@ValenceMobile/platform/whereTheStatusIs', () => ({ whereTheStatusIs: jest.fn() }));

const A_DUO = { top: 0, bottom: 20, left: 0, right: 84 };

beforeEach(() => {
  holdAWindowOf(871, 669);
  jest.mocked(useSafeAreaInsets).mockReset().mockReturnValue(A_DUO);
  jest.mocked(whereTheStatusIs).mockReset().mockResolvedValue(null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useTheSideStrip', () => {
  it('finds none on an ordinary phone, without asking where the status is', async () => {
    jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 59, bottom: 34, left: 0, right: 0 });

    const { result } = await renderHook(() => useTheSideStrip());

    expect(result.current).toBeNull();
    expect(whereTheStatusIs).not.toHaveBeenCalled();
  });

  it('keeps below the status and down the strip’s middle where it cannot say where that is', async () => {
    const { result } = await renderHook(() => useTheSideStrip());

    await waitFor(() => {
      expect(whereTheStatusIs).toHaveBeenCalled();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toEqual({ side: 'right', breadth: 84, freeFrom: 176, centreIn: 42 });
  });

  it('lines up with the status where it lies in the strip', async () => {
    jest.mocked(whereTheStatusIs).mockResolvedValue({ x: 800, y: 10, width: 60, height: 20 });

    const { result } = await renderHook(() => useTheSideStrip());

    await waitFor(() => {
      expect(result.current).toEqual({ side: 'right', breadth: 84, freeFrom: 46, centreIn: 41 });
    });
  });

  it('pays no heed to a status described as a band across the top of the window', async () => {
    jest.mocked(whereTheStatusIs).mockResolvedValue({ x: 0, y: 0, width: 871, height: 54 });

    const { result } = await renderHook(() => useTheSideStrip());

    await waitFor(() => {
      expect(whereTheStatusIs).toHaveBeenCalled();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toEqual({ side: 'right', breadth: 84, freeFrom: 176, centreIn: 42 });
  });
});
