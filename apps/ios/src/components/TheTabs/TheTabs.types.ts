import type { AGlyph } from '@ValencePhone/components/Icon/Icon.types';
import type { ReactNode } from 'react';

type ATab = {
  id: string;
  label: string;
  icon: AGlyph;
  symbol: string;
};

type TheTabsProps = {
  tabs: readonly ATab[];
  value: string;
  onSelect: (id: string) => void;
  children: ReactNode;
  above?: ReactNode;
};

export type { ATab, TheTabsProps };
