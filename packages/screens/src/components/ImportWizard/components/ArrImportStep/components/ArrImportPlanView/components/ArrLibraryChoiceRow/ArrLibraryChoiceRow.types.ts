import type { ArrImportLibraryPlan, ArrLibraryChoice } from '@ValenceContracts/schemas/ArrImport';

type ArrLibraryChoiceRowProps = {
  library: ArrImportLibraryPlan;
  choice: ArrLibraryChoice;
  isDisabled: boolean;
  onChoose: (choice: ArrLibraryChoice) => void;
};

export type { ArrLibraryChoiceRowProps };
