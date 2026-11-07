import type { ReactNode } from 'react';
import type { TitleScope } from '@ValenceClient/admin/fetchTitleMetadata';

type TitleDetailsProps = {
  mediaId: string;
  scope: TitleScope;
  onShowHistory?: () => void;
  onFixMatch?: () => void;
  after?: { label: string; content: ReactNode };
};

export type { TitleDetailsProps };
