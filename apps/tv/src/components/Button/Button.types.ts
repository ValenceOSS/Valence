import type { Ref } from 'react';
import type { View } from 'react-native';
import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'glossy'
  | 'confirm'
  | 'raised'
  | 'overlay'
  | 'glass'
  | 'soft'
  | 'ghost'
  | 'danger'
  | 'subtle'
  | 'link';

type ButtonSize = 'md' | 'lg' | 'xl' | 'play';

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
  minWidth?: number;
  isIconOnly?: boolean;
  iconSize?: number;
  hasPreferredFocus?: boolean;
  isRingHidden?: boolean;
};

export type { ButtonProps, ButtonSize, ButtonVariant };
