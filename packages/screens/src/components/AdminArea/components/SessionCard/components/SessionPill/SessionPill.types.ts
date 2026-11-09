import type { ReactNode } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type SessionPillProps = {
  children: ReactNode;
  glyph?: IconGlyph;
  side?: 'left' | 'right';
};

export type { SessionPillProps };
