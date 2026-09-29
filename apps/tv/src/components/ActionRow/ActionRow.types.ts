import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';

type ActionRowProps = {
  label: string;
  detail?: string;
  icon?: KeylineIcon;
  onPress: () => void;
  watchedFraction?: number;
  hasPreferredFocus?: boolean;
  isDisabled?: boolean;
};

export type { ActionRowProps };
