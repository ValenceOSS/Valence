import type { Household } from '@ValenceContracts/schemas/Household';

type HouseholdPicturePickerProps = {
  household: Household;
  picture: File | null;
  onPicked: (picture: File) => void;
  className?: string;
};

export type { HouseholdPicturePickerProps };
