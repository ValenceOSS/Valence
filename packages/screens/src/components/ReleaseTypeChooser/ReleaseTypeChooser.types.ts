import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';

type ReleaseTypeChooserProps = {
  value: ReleaseType[];
  onChange: (value: ReleaseType[]) => void;
};

export type { ReleaseTypeChooserProps };
