import type { LucideIcon } from 'lucide-react-native';

type ATab = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type TheTabsProps = {
  tabs: readonly ATab[];
  value: string;
  onSelect: (id: string) => void;
};

export type { ATab, TheTabsProps };
