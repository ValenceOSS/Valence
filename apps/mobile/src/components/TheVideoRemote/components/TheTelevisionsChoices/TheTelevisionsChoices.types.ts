import type { ASetOfChoices } from '@ValenceMobile/components/Watching/components/TheChoices/TheChoices.types';

type TheTelevisionsChoicesProps = {
  title: string;
  sets: readonly ASetOfChoices[];
  isOpen: boolean;
  onClose: () => void;
};

export type { TheTelevisionsChoicesProps };
