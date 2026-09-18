import type { ElementType, HTMLAttributes, ReactNode } from 'react';

type GlassElevation = 'floating' | 'inset' | 'film';

type GlassPanelProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
  children: ReactNode;
  elevation?: GlassElevation;
  as?: ElementType;
  className?: string;
};

export type { GlassElevation, GlassPanelProps };
