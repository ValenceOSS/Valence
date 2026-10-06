import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';
import type { ATab } from '@ValenceMobile/components/TheTabs/TheTabs.types';

type AFloatingTabsProps = {
  tabs: readonly ATab[];
  value: string;
  onSelect: (id: string) => void;
  onMeasure: (height: number) => void;
  onFaceAt?: (at: ARectOnScreen) => void;
  isFaceArriving: boolean;
};

export type { AFloatingTabsProps };
