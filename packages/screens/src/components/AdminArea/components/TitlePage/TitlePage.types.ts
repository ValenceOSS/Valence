type TitlePageProps = {
  titleKey: string;
  onBack: () => void;
  onOpenFolder?: (path: string) => void;
  onOpenTitle?: (titleKey: string) => void;
};

export type { TitlePageProps };
