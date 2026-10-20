import type { Household } from '@ValenceContracts/schemas/Household';

type HouseholdOnboardingProps = {
  accountId: string;
  name: string;
  household: Household;
  onDone: () => void;
};

export type { HouseholdOnboardingProps };
