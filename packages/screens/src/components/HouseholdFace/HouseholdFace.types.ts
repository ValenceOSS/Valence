import type { Household } from '@ValenceContracts/schemas/Household';

type HouseholdFaceProps = {
  household: Household;
  accountId?: string;
  pending?: File | null;
  shape?: 'circle' | 'tile';
  isLifted?: boolean;
  className?: string;
};

export type { HouseholdFaceProps };
