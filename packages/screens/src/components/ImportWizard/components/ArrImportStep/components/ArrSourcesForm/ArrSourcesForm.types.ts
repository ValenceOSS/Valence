import type { ArrImportSourceKind } from '@ValenceContracts/schemas/ArrImport';
import type { ArrSourceRow } from '@ValenceScreens/components/ImportWizard/components/ArrImportStep/ArrImportStep.types';

type ArrSourcesFormProps = {
  rows: readonly ArrSourceRow[];
  isDisabled: boolean;
  onChange: (id: number, change: Partial<Omit<ArrSourceRow, 'id'>>) => void;
  onAdd: (kind: ArrImportSourceKind) => void;
  onRemove: (id: number) => void;
};

export type { ArrSourcesFormProps };
