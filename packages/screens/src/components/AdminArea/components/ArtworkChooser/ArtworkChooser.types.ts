import type { ArtworkSubject } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/ArtworkPicker.types';

type ArtworkChooserProps = {
  subject: ArtworkSubject;
  onChanged: (jobId: string | null) => void;
};

export type { ArtworkChooserProps };
