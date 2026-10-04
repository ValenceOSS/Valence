import type { Avatar, ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type AFaceChoice = {
  avatar: Avatar;
  colour: ProfileColour;
  file: string | null;
};

type AFaceEditorProps = {
  isOpen: boolean;
  profile: Pick<ViewerProfile, 'id' | 'name' | 'colour' | 'avatar' | 'updatedAt'>;
  onClose: () => void;
  onUse: (choice: AFaceChoice) => void;
};

export type { AFaceChoice, AFaceEditorProps };
