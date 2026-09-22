import type { IconProps as KeylineProps } from '@keyline-icons/react';
import type { JSX } from 'react';

type KeylineIcon = (props: KeylineProps) => JSX.Element;

type IconProps = {
  of: KeylineIcon;
  size?: number;
  colour: string;
};

export type { IconProps, KeylineIcon };
