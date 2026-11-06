import type { TagSuggestion } from '@ValenceUI/TagField.types';
import type {
  TitleEditRequest,
  TitleField,
  TitleFieldState,
  TitleSubjectKind,
  TitleValue,
} from '@ValenceContracts/schemas/TitleEdit';

type MetadataFieldProps = {
  field: TitleField;
  kind: TitleSubjectKind;
  state: TitleFieldState | undefined;
  value: TitleValue;
  onValueChange: (value: TitleValue) => void;
  change: (request: TitleEditRequest) => Promise<{ isSaved: boolean; reason: string }>;
  onShowHistory?: () => void;
  suggestions?: readonly TagSuggestion[];
  region?: string;
  placeholder?: string;
  isLabelHidden?: boolean;
  className?: string;
};

export type { MetadataFieldProps };
