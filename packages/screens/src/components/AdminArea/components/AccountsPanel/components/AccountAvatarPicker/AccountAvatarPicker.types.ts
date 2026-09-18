import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { Household } from '@ValenceContracts/schemas/Household';

type AccountAvatarDraft = {
  avatar: Avatar;
  colour: ProfileColour;
  photo: File | null;
};

type AccountAvatarPickerProps = {
  accountId: string;
  face: Household | null;
  draft: AccountAvatarDraft;
  onDraft: (changes: Partial<AccountAvatarDraft>) => void;
};

export type { AccountAvatarDraft, AccountAvatarPickerProps };
