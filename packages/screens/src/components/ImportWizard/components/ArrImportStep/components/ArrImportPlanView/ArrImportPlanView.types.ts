import type { ArrImportPlan, ArrLibraryChoice } from '@ValenceContracts/schemas/ArrImport';

type ArrImportPlanViewProps = {
  plan: ArrImportPlan;
  secrets: Readonly<Record<string, string>>;
  choices: Readonly<Record<string, ArrLibraryChoice>>;
  isDisabled: boolean;
  onSecretChange: (key: string, value: string) => void;
  onChoose: (libraryId: string, choice: ArrLibraryChoice) => void;
};

export type { ArrImportPlanViewProps };
