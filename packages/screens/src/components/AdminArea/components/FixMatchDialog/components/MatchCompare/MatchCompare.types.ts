import type { MatchPreview, TitleField } from '@ValenceContracts/schemas/TitleEdit';

type MatchCompareProps = {
  mediaId: string;
  preview: MatchPreview;
  taken: ReadonlySet<TitleField>;
  onTake: (field: TitleField, isTaken: boolean) => void;
};

export type { MatchCompareProps };
