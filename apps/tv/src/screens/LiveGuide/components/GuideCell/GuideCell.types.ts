import type { View } from 'react-native';
import type { GuideCell } from '@ValenceClient/live/guideCellsOf';

type GuideCellProps = {
  cell: GuideCell;
  channelName: string;
  left: number;
  width: number;
  isOnNow: boolean;
  onWatch: () => void;
  onKeep: () => void;
  onFocus: (cell: GuideCell) => void;
  onBlur: (cell: GuideCell) => void;
  cellRef: (cell: GuideCell, element: View | null) => void;
};

export type { GuideCellProps };
