import type { ReactNode } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type MediaCardShape = 'poster' | 'wide';

type MediaCardEmphasis = 'lead' | 'standard';

type MediaCardCorner = {
  icon: IconGlyph;
  label: string;
};

type MediaCardProps = {
  title: string;
  eyebrow?: ReactNode;
  subtitle: ReactNode;
  badges?: string[];
  corner?: MediaCardCorner;
  imageUrl?: string;
  shape?: MediaCardShape;
  emphasis?: MediaCardEmphasis;
  watchedFraction?: number;
  onSelect: () => void;
  isStill?: boolean;
  className?: string;
};

export type { MediaCardCorner, MediaCardProps, MediaCardShape };
