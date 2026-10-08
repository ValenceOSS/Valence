import type { NavGroup } from '@ValenceLanding/components/LandingNav/LandingNav.types';

type NavPanelProps = {
  group: NavGroup;
  direction: number;
  onChoose: () => void;
  onMeasure: (height: number) => void;
};

export type { NavPanelProps };
