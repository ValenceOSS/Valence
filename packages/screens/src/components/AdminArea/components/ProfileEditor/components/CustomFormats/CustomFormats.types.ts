import type { FormatCondition } from '@ValenceContracts/schemas/QualityProfile';

type FormatDraft = { name: string; score: string; conditions: FormatCondition[] };

type CustomFormatsProps = {
  formats: readonly FormatDraft[];
  onChange: (formats: FormatDraft[]) => void;
};

export type { CustomFormatsProps, FormatDraft };
