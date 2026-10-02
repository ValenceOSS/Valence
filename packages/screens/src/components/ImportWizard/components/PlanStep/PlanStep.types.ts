import type { MediaImportRun, MediaImportSource } from '@ValenceContracts/schemas/MediaImport';
import type { PeopleChoice } from '@ValenceScreens/components/ImportWizard/components/PeopleStep/PeopleStep.types';

type PlanStepProps = {
  source: MediaImportSource;
  choice: PeopleChoice;
  onStarted: (run: MediaImportRun) => void;
  onBack: () => void;
};

export type { PlanStepProps };
