import type { MediaTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaTitle.types';

type TitleVersionsProps = {
  versions: readonly MediaTitle[];
  paths: Readonly<Record<string, string>>;
  onSplit?: (version: MediaTitle) => void;
};

export type { TitleVersionsProps };
