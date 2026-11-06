import type { TitleScope } from '@ValenceClient/admin/fetchTitleMetadata';
import type { TitleSubjectKind } from '@ValenceContracts/schemas/TitleEdit';

type TitleHistoryProps = {
  mediaId: string;
  scope: TitleScope;
  kind: TitleSubjectKind;
};

export type { TitleHistoryProps };
