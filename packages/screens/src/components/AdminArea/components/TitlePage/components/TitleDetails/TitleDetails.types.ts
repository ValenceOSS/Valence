import type { ReactNode } from 'react';

type TitleFact = { label: string; value: ReactNode };

type TitleDetailsProps = {
  title: string;
  facts: readonly TitleFact[];
  action?: { label: string; onPress: () => void };
};

export type { TitleDetailsProps, TitleFact };
