import type { Ref } from 'react';
import type { View } from 'react-native';
import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';

type ButtonVariant =
  'primary' | 'secondary' | 'glossy' | 'confirm' | 'overlay' | 'soft' | 'ghost' | 'danger';

type ButtonSize = 'md' | 'lg' | 'xl';

type ButtonProps = {
  label: string;
  detail?: string;
  icon?: KeylineIcon;
  onPress: () => void;
  ref?: Ref<View> | undefined;
  onFocus?: () => void;
  onBlur?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isPill?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  isWide?: boolean;
  isIconOnly?: boolean;
  iconSize?: number;
  hasPreferredFocus?: boolean;
};

export type { ButtonProps, ButtonSize, ButtonVariant };
