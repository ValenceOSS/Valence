import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';

type ServerCardProps = {
  name: string;
  address: string | null;
  icon: KeylineIcon;
  isAvailable?: boolean;
  isDisabled?: boolean;
  hasPreferredFocus?: boolean;
  onPress: () => void;
};

export type { ServerCardProps };
