import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';

type ATab = {
  id: string;
  label: string;
  icon: LucideIcon;
  symbol: string;
};

type TheTabsProps = {
  tabs: readonly ATab[];
  value: string;
  onSelect: (id: string) => void;
  children: ReactNode;
};

export type { ATab, TheTabsProps };
