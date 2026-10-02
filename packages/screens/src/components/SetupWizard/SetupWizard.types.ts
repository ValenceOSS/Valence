import type { SetupStatus } from '@ValenceContracts/schemas/Setup';

type SetupStepId =
  | 'welcome'
  | 'account'
  | 'access'
  | 'profile'
  | 'household'
  | 'catalogue'
  | 'libraries'
  | 'import'
  | 'done';

type SetupWizardProps = {
  status: SetupStatus;
  onComplete: () => void;
  startsAt?: 'welcome' | 'profile';
};

type AccountDraft = {
  name: string;
  username: string;
  email: string;
  password: string;
  again: string;
};

type AccountErrors = Partial<Record<keyof AccountDraft, string>>;

type ImportedFrom = 'fresh' | 'server' | 'requests';

export type { AccountDraft, AccountErrors, ImportedFrom, SetupStepId, SetupWizardProps };
