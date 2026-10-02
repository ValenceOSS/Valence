import type { ReactNode } from 'react';

type SetupStepFrameProps = {
  title: string;
  lead: ReactNode;
  children?: ReactNode;
  back?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  isWide?: boolean;
};

export type { SetupStepFrameProps };
