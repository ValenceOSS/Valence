import type { ReactNode } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { OriginMarkProps } from '@ValenceUI/OriginMark.types';

type MediaCardShape = 'poster' | 'wide' | 'book' | 'square';

type MediaCardEmphasis = 'lead' | 'standard';

type MediaCardCorner = {
  icon: IconGlyph;
  label: string;
};

type MediaCardMeter = {
  fraction: number;
  tone: 'busy' | 'accent' | 'success' | 'highlight' | 'danger' | 'quiet' | 'gap';
  label: string;
};

type MediaCardOrigin = Omit<OriginMarkProps, 'className'>;

type MediaCardProps = {
  title: string;
  eyebrow?: ReactNode;
  subtitle: ReactNode;
  badges?: string[];
  overlay?: ReactNode;
  corner?: MediaCardCorner;
  origin?: MediaCardOrigin;
  count?: number;
  countLabel?: string;
  imageUrl?: string;
  logoUrl?: string;
  shape?: MediaCardShape;
  emphasis?: MediaCardEmphasis;
  watchedFraction?: number;
  meter?: MediaCardMeter;
  onSelect: () => void;
  isStill?: boolean;
  className?: string;
};

export type { MediaCardCorner, MediaCardMeter, MediaCardOrigin, MediaCardProps, MediaCardShape };
