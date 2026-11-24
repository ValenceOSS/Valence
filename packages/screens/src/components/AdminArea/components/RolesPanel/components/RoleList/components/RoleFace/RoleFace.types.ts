import type { ReactNode } from 'react';

type RoleFaceProps = {
  name: string;
  color: string | null;
  grantsEverything: boolean;
  memberCount: number | null;
  isChosen: boolean;
  lead: ReactNode;
  menu: ReactNode;
  onChoose: () => void;
};

export type { RoleFaceProps };
