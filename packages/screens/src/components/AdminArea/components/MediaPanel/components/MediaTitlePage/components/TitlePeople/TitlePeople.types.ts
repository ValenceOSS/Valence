import type { TitleScope } from '@ValenceClient/admin/fetchTitleMetadata';

type TitlePeopleProps = {
  mediaId: string;
  scope?: TitleScope;
  field?: 'cast' | 'guestStars';
  onShowHistory?: () => void;
};

export type { TitlePeopleProps };
