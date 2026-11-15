import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type AStackedPage = {
  key: string;
  page: ReactNode;
  rises?: boolean;
  isCard?: boolean;
  goesBack?: boolean;
  depth?: number;
  trail?: readonly AStackedPage[];
  holdsTheEdge?: boolean;
};

type ACardScroll = {
  atTop: (isAtTop: boolean) => void;
  pullDown: (dy: number) => void;
  letGo: (dy: number, vy: number) => void;
};

type APageStackProps = {
  pages: readonly AStackedPage[];
  onBack: () => void;
  onStepBack?: () => void;
};

type AHeldStack = {
  pages: readonly AStackedPage[];
  slots: ReadonlyMap<string, string>;
  places: ReadonlyMap<string, SharedValue<number>>;
};

type ACardSwap = {
  gone: AStackedPage;
  toKey: string;
  isForward: boolean;
};

type AnActivity = 0 | 1 | 2;

type AKeeping = {
  activity: AnActivity;
  isFrozen: boolean;
};

export type {
  ACardScroll,
  ACardSwap,
  AHeldStack,
  AKeeping,
  AnActivity,
  APageStackProps,
  AStackedPage,
};
