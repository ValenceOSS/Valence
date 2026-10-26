import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';

type ShowcaseScopeProps = {
  seed?: (cache: QueryClient) => void;
  children: ReactNode;
};

export type { ShowcaseScopeProps };
