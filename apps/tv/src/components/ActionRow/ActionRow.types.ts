import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';

type ActionRowProps = {
  label: string;
  icon?: KeylineIcon;
  onPress: () => void;
  watchedFraction?: number;
  hasPreferredFocus?: boolean;
};

export type { ActionRowProps };
