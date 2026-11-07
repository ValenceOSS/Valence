import type { ReactNode } from 'react';
import type { TitleScope } from '@ValenceClient/admin/fetchTitleMetadata';
import type { TitleMetadata } from '@ValenceContracts/schemas/TitleEdit';

type TitleFormProps = {
  metadata: TitleMetadata;
  mediaId: string;
  scope: TitleScope;
  onShowHistory?: () => void;
  onFixMatch?: () => void;
  after?: { label: string; content: ReactNode };
};

export type { TitleFormProps };
