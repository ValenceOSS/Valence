import type { MediaImportSource } from '@ValenceContracts/schemas/MediaImport';

type PeopleChoice = {
  skipUserIds: string[];
  meUserId: string | null;
};

type PeopleStepProps = {
  source: MediaImportSource;
  onContinue: (choice: PeopleChoice) => void;
  onBack: () => void;
};

export type { PeopleChoice, PeopleStepProps };
