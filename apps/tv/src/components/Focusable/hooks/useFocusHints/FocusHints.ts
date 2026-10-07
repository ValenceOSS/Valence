import type { Ref } from 'react';
import type { View } from 'react-native';

type FocusHints = {
  ref: Ref<View> | undefined;
  hints: { hasTVPreferredFocus?: boolean; nextFocusRight?: View | null };
};

export type { FocusHints };
