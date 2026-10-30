import type { ComponentProps, ReactElement } from 'react';
import type { Button } from '@expo/ui/swift-ui';

type ASymbol = NonNullable<ComponentProps<typeof Button>['systemImage']>;

type AMenuItem = {
  id: string;
  label: string;
  symbol?: ASymbol;
  isChosen?: boolean;
  isDestructive?: boolean;
  startsAGroup?: boolean;
  onChoose: () => void;
};

type AMenuProps = {
  label: string;
  title?: string;
  items: readonly AMenuItem[];
  children: ReactElement;
};

export type { AMenuItem, AMenuProps, ASymbol };
