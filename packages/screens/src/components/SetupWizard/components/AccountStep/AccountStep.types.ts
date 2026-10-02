import type { AccountDraft } from '@ValenceScreens/components/SetupWizard/SetupWizard.types';

type AccountStepProps = {
  draft: AccountDraft;
  onChange: (draft: AccountDraft) => void;
  onBack: () => void;
  onContinue: () => void;
};

export type { AccountStepProps };
