import type { ReactNode } from 'react';

type PanelCardInfoProps = {
  label: string;
  detail: ReactNode;
  isList?: boolean;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
};

export type { PanelCardInfoProps };
