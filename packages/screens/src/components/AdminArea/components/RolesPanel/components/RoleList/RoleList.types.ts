import type { Role } from '@ValenceContracts/schemas/Permission';

type RoleListProps = {
  roles: readonly Role[];
  outOfReach: ReadonlySet<string>;
  memberCounts: ReadonlyMap<string, number>;
  chosenId: string | null;
  newRoleName: string | null;
  onChoose: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onDelete: (role: Role) => void;
};

export type { RoleListProps };
