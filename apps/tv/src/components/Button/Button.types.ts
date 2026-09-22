import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';

type ButtonVariant =
  'primary' | 'secondary' | 'glossy' | 'confirm' | 'overlay' | 'soft' | 'ghost' | 'danger';

type ButtonSize = 'md' | 'lg' | 'xl';

type ButtonProps = {
  label: string;
  detail?: string;
  icon?: KeylineIcon;
  onPress: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isPill?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  isWide?: boolean;
  hasPreferredFocus?: boolean;
};

export type { ButtonProps, ButtonSize, ButtonVariant };
