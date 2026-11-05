import type { CastEntry } from '@ValenceContracts/schemas/TitleEdit';

type CastRowProps = {
  member: CastEntry;
  onRole: (role: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

export type { CastRowProps };
