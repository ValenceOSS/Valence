import type { TagSuggestion } from '@ValenceUI/TagField.types';
import type {
  TitleEditRequest,
  TitleField,
  TitleFieldState,
  TitleSubjectKind,
} from '@ValenceContracts/schemas/TitleEdit';

type MetadataFieldProps = {
  field: TitleField;
  kind: TitleSubjectKind;
  state: TitleFieldState | undefined;
  change: (request: TitleEditRequest) => Promise<{ isSaved: boolean; reason: string }>;
  onShowHistory?: () => void;
  suggestions?: readonly TagSuggestion[];
  region?: string;
  placeholder?: string;
  isCard?: boolean;
  className?: string;
};

export type { MetadataFieldProps };
