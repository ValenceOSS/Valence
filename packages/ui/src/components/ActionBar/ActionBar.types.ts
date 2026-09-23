import type { ReactNode } from 'react';

type ActionBarChoice = {
  id: string;
  label: string;
  onChoose: () => void;
};

type ActionBarAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  isPinned?: boolean;
  onChoose: () => void;
  choices?: readonly ActionBarChoice[];
};

type ActionBarProps = {
  label: string;
  primary: ReactNode;
  actions: readonly ActionBarAction[];
  className?: string;
};

export type { ActionBarAction, ActionBarChoice, ActionBarProps };
