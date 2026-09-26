import type { Avatar, ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type FaceChoice = { avatar: Avatar; photo: File | null; colour: ProfileColour };

type FaceEditorProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: ViewerProfile;
  start: FaceChoice;
  onUse: (choice: FaceChoice) => void;
};

export type { FaceChoice, FaceEditorProps };
