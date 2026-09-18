import type { Household } from '@ValenceContracts/schemas/Household';

type HouseholdFaceProps = {
  household: Household;
  accountId?: string;
  pending?: File | null;
  className?: string;
};

export type { HouseholdFaceProps };
