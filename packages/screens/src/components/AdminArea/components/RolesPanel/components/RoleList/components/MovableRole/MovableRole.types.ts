import type { ReactNode } from 'react';
import type { Role } from '@ValenceContracts/schemas/Permission';

type MovableRoleProps = {
  role: Role;
  onDragEnd: () => void;
  children: ReactNode;
};

export type { MovableRoleProps };
