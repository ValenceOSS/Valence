import type { TitleScope } from '@ValenceClient/admin/fetchTitleMetadata';

type TitleDetailsProps = {
  mediaId: string;
  scope: TitleScope;
  onShowHistory?: () => void;
  onFixMatch?: () => void;
};

export type { TitleDetailsProps };
