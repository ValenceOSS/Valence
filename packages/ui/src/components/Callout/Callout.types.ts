import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { ReactNode } from 'react';

type CalloutTone = 'quiet' | 'warning' | 'danger';

type CalloutProps = {
  title: string;
  children?: ReactNode;
  tone?: CalloutTone;
  icon?: IconGlyph;
  action?: ReactNode;
  className?: string;
};

export type { CalloutProps, CalloutTone };
