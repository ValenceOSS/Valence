import type { ReactNode } from 'react';

type BadgeTone =
  'quiet' | 'accent' | 'success' | 'highlight' | 'solid' | 'busy' | 'warning' | 'danger';

type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  colour?: string | null;
  size?: BadgeSize;
  className?: string;
};

export type { BadgeProps, BadgeSize, BadgeTone };
