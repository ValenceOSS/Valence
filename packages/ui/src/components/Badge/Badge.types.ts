import type { ReactNode } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type BadgeTone =
  | 'quiet'
  | 'accent'
  | 'success'
  | 'highlight'
  | 'solid'
  | 'busy'
  | 'waiting'
  | 'warning'
  | 'danger'
  | 'outline';

type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  colour?: string | null;
  icon?: IconGlyph;
  size?: BadgeSize;
  className?: string;
};

export type { BadgeProps, BadgeSize, BadgeTone };
