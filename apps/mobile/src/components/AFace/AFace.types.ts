import type { ComponentProps } from 'react';
import type { Animated } from 'react-native';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type AFaceProps = {
  profile: Pick<ViewerProfile, 'id' | 'updatedAt' | 'avatar' | 'name' | 'colour'>;
  picked?: string | null;
  isLarge?: boolean;
  isSmall?: boolean;
  tileMotion?: ComponentProps<typeof Animated.View>['style'];
};

export type { AFaceProps };
