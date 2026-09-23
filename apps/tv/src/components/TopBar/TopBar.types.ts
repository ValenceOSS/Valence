import type { View } from 'react-native';
import type { Spot } from '@ValenceTv/components/Flight/Flight.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { Tab } from '@ValenceTv/navigation/Tab';

type TopBarProps = {
  current: Tab;
  onChoose: (tab: Tab) => void;
  profile: ViewerProfile | null;
  itemRef: (item: Tab, element: View | null) => void;
  onTabFocus: (isIn: boolean) => void;
  isArriving: boolean;
  onFaceAt: (at: Spot) => void;
  onMarkAt: (at: Spot) => void;
};

export type { TopBarProps };
