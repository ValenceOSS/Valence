import type { Household } from '@ValenceContracts/schemas/Household';

type ASetUpTheHouseholdProps = {
  household: Household;
  onDone: () => void;
};

export type { ASetUpTheHouseholdProps };
