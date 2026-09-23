import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';

type AMusicHeadProps = {
  kind: string;
  title: string;
  detail: string | null;
  artwork: string | null;
  standIn: LucideIcon;
  isRound?: boolean;
  canPlay: boolean;
  onPlay: () => void;
  onShuffle: () => void;
  children?: ReactNode;
};

export type { AMusicHeadProps };
