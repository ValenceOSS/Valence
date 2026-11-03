import type { ReactNode, Ref } from 'react';

type TitleHeroProps = {
  preview: ReactNode;
  children: ReactNode;
  lead?: ReactNode;
  corner?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

export type { TitleHeroProps };
