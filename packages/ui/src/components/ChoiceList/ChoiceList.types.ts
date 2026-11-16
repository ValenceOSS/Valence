import type { ReactNode } from 'react';

type Choice = {
  id: string;
  title: string;
  detail?: ReactNode;
  note?: string;
  aside?: ReactNode;
  isDisabled?: boolean;
};

type ChoiceListProps = {
  label: string;
  choices: readonly Choice[];
  value: string | null;
  onChoose: (id: string) => void;
  look?: 'rows' | 'tiles';
  className?: string;
};

export type { Choice, ChoiceListProps };
