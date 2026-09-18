import type { Avatar, ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type AccountAvatarDraft = {
  avatar: Avatar;
  colour: ProfileColour;
  photo: File | null;
};

type AccountAvatarPickerProps = {
  accountId: string;
  face: ViewerProfile | null;
  draft: AccountAvatarDraft;
  onDraft: (changes: Partial<AccountAvatarDraft>) => void;
};

export type { AccountAvatarDraft, AccountAvatarPickerProps };
