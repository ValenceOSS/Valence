import type { ReactNode } from 'react';

type UiExample = {
  title: string;
  render: () => ReactNode;
};

type UiExampleGroup = {
  name: string;
  examples: Readonly<Record<string, readonly UiExample[]>>;
};

export type { UiExample, UiExampleGroup };
