import type { AGlyph } from '@ValencePhone/components/Icon/Icon.types';
import type { ReactNode } from 'react';

type AMusicHeadProps = {
  kind: string;
  title: string;
  detail: string | null;
  artwork: string | null;
  standIn: AGlyph;
  isRound?: boolean;
  canPlay: boolean;
  onPlay: () => void;
  onShuffle: () => void;
  children?: ReactNode;
};

export type { AMusicHeadProps };
