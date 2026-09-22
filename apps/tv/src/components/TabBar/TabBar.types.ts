import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';

type TabBarProps<Tab extends string> = {
  tabs: readonly { id: Tab; label: string; icon?: KeylineIcon }[];
  current: Tab;
  onChoose: (tab: Tab) => void;
  isStartingHere?: boolean;
  onFocusChange?: (isIn: boolean) => void;
};

export type { TabBarProps };
