import type { ArrPathMapping } from '@ValenceContracts/schemas/ArrImport';

type ArrPathMappingsFormProps = {
  mappings: readonly ArrPathMapping[];
  isDisabled: boolean;
  onChange: (mappings: ArrPathMapping[]) => void;
};

export type { ArrPathMappingsFormProps };
