import type { ArtworkSubject } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/ArtworkPicker.types';
type TitlePageProps = {
  titleKey: string;
  onBack: () => void;
  onOpenFolder?: (path: string) => void;
  onOpenTitle?: (titleKey: string) => void;
  onChooseArtwork?: (subject: ArtworkSubject) => void;
};

export type { TitlePageProps };
