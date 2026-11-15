import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import type { ReactNode } from 'react';
import type { ScreenRows } from '@ValenceMobile/components/Screen/Screen.types';

type AMusicScreenProps = {
  title: string;
  artwork: string | null;
  albumIds?: readonly string[];
  standIn: AGlyph;
  onBack: () => void;
  children: ReactNode;
  rows?: ScreenRows;
  afterRows?: ReactNode;
};

export type { AMusicScreenProps };
