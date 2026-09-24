import type { AGlyph } from '@ValencePhone/components/Icon/Icon.types';
import type { ReactNode } from 'react';
import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';
import type { ThePicture } from '@ValencePhone/components/APicture/APicture.types';

type ATabFace = {
  picture: ThePicture | null;
  backdrop: string;
  initial: string;
};

type ATab = {
  id: string;
  label: string;
  icon: AGlyph;
  symbol: string;
  face?: ATabFace;
};

type TheTabsProps = {
  tabs: readonly ATab[];
  value: string;
  onSelect: (id: string) => void;
  children: ReactNode;
  above?: ReactNode;
  onFaceAt?: (at: ARectOnScreen) => void;
  isFaceArriving?: boolean;
};

export type { ATab, ATabFace, TheTabsProps };
