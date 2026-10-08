import type { NavItem } from '@ValenceLanding/components/LandingNav/LandingNav.types';

type NavEntryProps = {
  item: NavItem;
  size: 'panel' | 'menu';
  onChoose: () => void;
  onAim?: () => void;
};

export type { NavEntryProps };
