import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { PressSound } from '@ValenceUI/sounds/sounds.types';

type ButtonVariant =
  | 'primary'
  | 'glossy'
  | 'confirm'
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
  | 'bare';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isPill?: boolean;
  joins?: 'next';
  label?: string;
  isIconOnly?: boolean;
  isActive?: boolean;
  hasTooltip?: boolean;
  tooltipDelayMilliseconds?: number;
  className?: string;
  sound?: PressSound | 'none';
};

export type { ButtonProps, ButtonVariant, ButtonSize };
