import type { Permission } from '@ValenceContracts/schemas/Permission';

type PermissionEditorProps = {
  catalogue: Permission[];
  selected: Permission[];
  onToggle: (permission: Permission) => void;
};

export type { PermissionEditorProps };
