import type { ReactNode } from 'react';

type PermissionGroupProps = {
  heading: string;
  heldCount: number;
  totalCount: number;
  children: ReactNode;
};

export type { PermissionGroupProps };
