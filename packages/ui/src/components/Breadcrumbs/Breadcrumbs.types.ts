type Crumb = { id: string; label: string };

type BreadcrumbsProps = {
  label: string;
  crumbs: readonly Crumb[];
  onChoose: (id: string) => void;
  className?: string;
};

export type { BreadcrumbsProps, Crumb };
