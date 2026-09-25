import type { ReactNode } from 'react';

type Choice = {
  id: string;
  title: string;
  detail?: string;
  note?: string;
  aside?: ReactNode;
};

type ChoiceListProps = {
  label: string;
  choices: readonly Choice[];
  value: string | null;
  onChoose: (id: string) => void;
  className?: string;
};

export type { Choice, ChoiceListProps };
