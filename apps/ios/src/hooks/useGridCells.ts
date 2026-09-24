import { useWindowDimensions } from 'react-native';
import { POSTER_WIDTH } from '@ValencePhone/components/APoster/POSTER_WIDTH';
import { GRID_GAP } from '@ValencePhone/components/APosterGrid/GRID_GAP';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';

/**
 * How many posters fit across the screen between its edges, and how wide each must be drawn for
 * the row to fill it exactly.
 *
 * @param asked - How many across, where the grid decides rather than the width.
 * @returns How many across, and the width of each.
 */
const useGridCells = (asked?: number): { across: number; cell: number } => {
  const { width } = useWindowDimensions();
  const room = width - SCREEN_EDGE * 2;
  const across = asked ?? Math.max(1, Math.floor((room + GRID_GAP) / (POSTER_WIDTH + GRID_GAP)));

  return { across, cell: (room - GRID_GAP * (across - 1)) / across };
};

export { useGridCells };
