import type { TitleScope } from '@ValenceClient/admin/fetchTitleMetadata';

type TitleDetailsProps = {
  mediaId: string;
  scope: TitleScope;
  onShowHistory?: () => void;
};

export type { TitleDetailsProps };
