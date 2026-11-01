import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import type { ReactNode } from 'react';

type AMusicScreenProps = {
  title: string;
  artwork: string | null;
  albumIds?: readonly string[];
  standIn: AGlyph;
  onBack: () => void;
  children: ReactNode;
};

export type { AMusicScreenProps };
