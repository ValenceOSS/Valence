import type { ComponentProps, ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
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

type NativeMenuProps = {
  items: readonly Omit<AMenuItem, 'onChoose'>[];
  onChoose: (event: { nativeEvent: { id: string } }) => void;
  onOpen: () => void;
  onClose: () => void;
  style: StyleProp<ViewStyle>;
};

export type { AMenuItem, AMenuProps, ASymbol, NativeMenuProps };
