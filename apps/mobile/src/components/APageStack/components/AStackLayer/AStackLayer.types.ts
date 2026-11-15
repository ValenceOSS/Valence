import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { AKeeping } from '@ValenceMobile/components/APageStack/APageStack.types';

type AStackLayerProps = {
  place: SharedValue<number>;
  keeping: AKeeping;
  isTop: boolean;
  isCard: boolean;
  isUnderACard: boolean;
  rises: boolean;
  isStill: boolean;
  isMoving: boolean;
  cardTop: number;
  width: number;
  height: number;
  children: ReactNode;
};

export type { AStackLayerProps };
