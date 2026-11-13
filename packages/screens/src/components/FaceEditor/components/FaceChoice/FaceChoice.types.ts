import type { ReactNode } from 'react';

type FaceChoiceProps = {
  label: string;
  name: string;
  isChosen: boolean;
  isDisabled?: boolean;
  onChoose: () => void;
  children?: ReactNode;
};

export type { FaceChoiceProps };
