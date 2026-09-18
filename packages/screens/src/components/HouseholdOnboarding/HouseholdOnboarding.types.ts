import type { Household } from '@ValenceContracts/schemas/Household';

type HouseholdOnboardingProps = {
  household: Household;
  onDone: () => void;
};

export type { HouseholdOnboardingProps };
