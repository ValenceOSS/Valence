import type { ReactNode } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type ProblemCardProps = {
  icon: IconGlyph;
  headline: string;
  reason: string;
  said?: string | null;
  actions: ReactNode;
};

export type { ProblemCardProps };
