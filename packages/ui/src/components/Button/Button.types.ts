import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type ButtonVariant =
  | 'primary'
  | 'glossy'
  | 'confirm'
  | 'inverse'
  | 'secondary'
  | 'raised'
  | 'soft'
  | 'ghost'
  | 'danger'
  | 'overlay'
  | 'link'
  | 'subtle'
  | 'discord'
  | 'row'
  | 'windowControl'
  | 'windowClose'
  | 'bare';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isPill?: boolean;
  joins?: 'next' | 'previous';
  label?: string;
  isIconOnly?: boolean;
  isActive?: boolean;
  hasTooltip?: boolean;
  shortcut?: readonly string[];
  tooltipDelayMilliseconds?: number;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

export type { ButtonProps, ButtonVariant, ButtonSize };
