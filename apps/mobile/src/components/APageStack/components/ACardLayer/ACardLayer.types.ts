import type { SharedValue } from 'react-native-reanimated';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { AKeeping, AStackedPage } from '@ValenceMobile/components/APageStack/APageStack.types';

type ACardMotion =
  | 'shown'
  | 'hidden'
  | 'peelingAway'
  | 'peeledTo'
  | 'goingForward'
  | 'arrivingForward'
  | 'goingBack'
  | 'arrivingBack';

type ACardLayerProps = {
  layer: AStackedPage;
  motion: ACardMotion;
  keeping: AKeeping;
  isOnTop: boolean;
  isLifted: boolean;
  isTouchable: boolean;
  isStill: boolean;
  width: number;
  swapping: SharedValue<number>;
  peeling: SharedValue<number>;
  insets: EdgeInsets;
  onAtTop: (key: string, isAtTop: boolean) => void;
  pullDown: (dy: number) => void;
  letGo: (dy: number, vy: number) => void;
};

export type { ACardLayerProps, ACardMotion };
