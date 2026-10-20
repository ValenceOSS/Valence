import type { ReactNode } from 'react';

type WelcomeToValenceProps = {
  name: string;
  onFinished: () => void;
  children?: ReactNode;
};

export type { WelcomeToValenceProps };
