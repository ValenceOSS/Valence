import type { BulkReplace } from '@ValenceContracts/schemas/BulkTitleEdit';
import type { TitleSubjectKind } from '@ValenceContracts/schemas/TitleEdit';

type FindReplaceProps = {
  fields: readonly BulkReplace['field'][];
  kind: TitleSubjectKind;
  replace: BulkReplace | null;
  onReplace: (replace: BulkReplace | null) => void;
};

export type { FindReplaceProps };
