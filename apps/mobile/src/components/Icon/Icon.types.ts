import type { ReactElement } from 'react';
import type { IconProps as KeylineProps } from '@keyline-icons/react-native';

type AGlyph = (props: KeylineProps) => ReactElement;

type IconProps = {
  of: AGlyph;
  size?: number;
  colour: string;
  label?: string;
};

export type { AGlyph, IconProps };
