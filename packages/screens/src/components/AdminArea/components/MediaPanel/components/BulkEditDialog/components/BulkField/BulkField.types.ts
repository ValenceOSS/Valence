import type { BulkFieldState } from '@ValenceContracts/schemas/BulkTitleEdit';
import type { TitleField, TitleSubjectKind } from '@ValenceContracts/schemas/TitleEdit';
import type { TagSuggestion } from '@ValenceUI/TagField.types';
import type { BulkTouch } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/BulkEditDialog/BulkTouch.types';

type BulkFieldProps = {
  field: TitleField;
  kind: TitleSubjectKind;
  state: BulkFieldState | undefined;
  touch: BulkTouch | undefined;
  onTouch: (touch: BulkTouch | undefined) => void;
  region: string;
  suggestions?: readonly TagSuggestion[];
  className?: string;
};

export type { BulkFieldProps };
