import type { View } from 'react-native';
import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';

type TabBarProps<Tab extends string> = {
  tabs: readonly { id: Tab; label: string; icon?: KeylineIcon }[];
  current: Tab;
  onChoose: (tab: Tab) => void;
  isStartingHere?: boolean;
  onFocusChange?: (isIn: boolean) => void;
  itemRef?: (tab: Tab, item: View | null) => void;
};

export type { TabBarProps };
