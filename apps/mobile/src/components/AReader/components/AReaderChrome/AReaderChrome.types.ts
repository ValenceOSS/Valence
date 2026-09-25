import type { ReactNode } from 'react';

type AReaderChromeProps = {
  title: string;
  place: string | null;
  paper: string;
  ink: string;
  isDarkPage: boolean;
  isShown: boolean;
  onBack: () => void;
  onPanel: () => void;
  footer: ReactNode;
  children: ReactNode;
};

export type { AReaderChromeProps };
