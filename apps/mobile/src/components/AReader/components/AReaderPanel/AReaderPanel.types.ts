import type { ReactNode } from 'react';

type AReaderPlace = {
  id: string;
  label: string;
  depth: number;
  isHere: boolean;
};

type AReaderPanelProps = {
  isOpen: boolean;
  title: string;
  placesAre: string;
  places: readonly AReaderPlace[];
  onPlace: (id: string) => void;
  onClose: () => void;
  children: ReactNode;
};

export type { AReaderPanelProps, AReaderPlace };
