import type { ReactNode } from 'react';

type WelcomeToValenceProps = {
  name: string;
  household: string;
  onFinished: () => void;
  children?: ReactNode;
};

export type { WelcomeToValenceProps };
