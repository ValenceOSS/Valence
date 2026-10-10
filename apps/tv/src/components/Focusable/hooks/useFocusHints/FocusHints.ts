import type { Ref } from 'react';
import type { View } from 'react-native';

type NextFocus = { right?: View | null; down?: View | null; up?: View | null };

type FocusHints = {
  ref: Ref<View> | undefined;
  hints: {
    hasTVPreferredFocus?: boolean;
    nextFocusRight?: View | null;
    nextFocusDown?: View | null;
    nextFocusUp?: View | null;
  };
};

export type { FocusHints, NextFocus };
