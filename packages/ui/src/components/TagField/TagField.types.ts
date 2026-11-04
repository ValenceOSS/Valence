type TagSuggestion = { value: string; count?: number };

type TagFieldProps = {
  label: string;
  values: readonly string[];
  onValuesChange: (values: string[]) => void;
  suggestions?: readonly TagSuggestion[];
  placeholder?: string;
  isLabelHidden?: boolean;
  disabled?: boolean;
  className?: string;
};

export type { TagFieldProps, TagSuggestion };
