import type { ArtworkPart } from '@ValenceClient/library/queryOfPart';
import type { ArtworkSubject } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/ArtworkPicker.types';

type ArtworkChooserProps = {
  subject: ArtworkSubject;
  onChanged: (jobId: string | null) => void;
  part?: ArtworkPart;
};

export type { ArtworkChooserProps };
