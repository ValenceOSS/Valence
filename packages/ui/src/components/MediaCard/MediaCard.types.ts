import type { ReactNode } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { OriginMarkProps } from '@ValenceUI/OriginMark.types';
import type { BadgeTone } from '@ValenceUI/Badge.types';

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

type MediaCardBadge = {
  label: string;
  tone: BadgeTone;
};

type MediaCardProps = {
  title: string;
  eyebrow?: ReactNode;
  subtitle: ReactNode;
  badges?: readonly (string | MediaCardBadge)[];
  overlay?: ReactNode;
  corner?: MediaCardCorner;
  origin?: MediaCardOrigin;
  alsoFrom?: readonly MediaCardOrigin[];
  status?: MediaCardBadge;
  count?: number;
  countLabel?: string;
  imageUrl?: string;
  logoUrl?: string;
  shape?: MediaCardShape;
  emphasis?: MediaCardEmphasis;
  watchedFraction?: number;
  meter?: MediaCardMeter;
  onSelect: () => void;
  href?: string;
  isStill?: boolean;
  className?: string;
};

export type {
  MediaCardBadge,
  MediaCardCorner,
  MediaCardMeter,
  MediaCardOrigin,
  MediaCardProps,
  MediaCardShape,
};
