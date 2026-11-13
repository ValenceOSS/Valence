import type { ReactNode } from 'react';

type AFaceChoiceProps = {
  label: string;
  name: string;
  isChosen: boolean;
  isDisabled?: boolean;
  onChoose: () => void;
  children?: ReactNode;
};

export type { AFaceChoiceProps };
