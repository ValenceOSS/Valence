import type { ComponentType, ReactNode } from 'react';

type DocContentProps = { components?: Record<string, (props: never) => ReactNode> };

type DocModule = { default: ComponentType<DocContentProps> };

type DocPage = {
  path: string;
  section: string;
  sectionTitle: string;
  title: string;
  description: string;
  order: number;
  load: () => Promise<DocModule>;
};

type NavItem = {
  path: string;
  title: string;
  order: number;
};

type NavSection = {
  id: string;
  title: string;
  items: readonly NavItem[];
};

export type { DocContentProps, DocModule, DocPage, NavItem, NavSection };
