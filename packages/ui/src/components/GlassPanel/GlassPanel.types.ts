import type { ElementType, HTMLAttributes, ReactNode } from 'react';

type GlassElevation = 'floating' | 'inset' | 'clear' | 'film';

type GlassPanelProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
  children: ReactNode;
  elevation?: GlassElevation;
  radius?: 'default' | 'large';
  as?: ElementType;
  className?: string;
};

export type { GlassElevation, GlassPanelProps };
