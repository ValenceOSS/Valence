import type { ReactNode } from 'react';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';
import type { ATab } from '@ValenceMobile/components/TheTabs/TheTabs.types';

type AGlassTabsProps = {
  tabs: readonly ATab[];
  value: string;
  onSelect: (id: string) => void;
  onMeasure: (height: number) => void;
  onFaceAt?: (at: ARectOnScreen) => void;
  isFaceArriving: boolean;
  children: ReactNode;
};

export type { AGlassTabsProps };
