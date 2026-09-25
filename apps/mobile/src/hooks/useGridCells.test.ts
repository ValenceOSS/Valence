import { Dimensions } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { GRID_GAP } from '@ValenceMobile/components/APosterGrid/GRID_GAP';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { useGridCells } from './useGridCells';

describe('useGridCells', () => {
  it('draws each poster wide enough for the row to fill the screen between its edges', async () => {
    const { result } = await renderHook(() => useGridCells());
    const { across, cell } = result.current;

    expect(across).toBeGreaterThan(0);
    expect(cell * across + GRID_GAP * (across - 1)).toBeCloseTo(
      Dimensions.get('window').width - SCREEN_EDGE * 2,
    );
  });

  it('keeps to as many across as it is asked for', async () => {
    const { result } = await renderHook(() => useGridCells(2));

    expect(result.current.across).toBe(2);
  });
});
