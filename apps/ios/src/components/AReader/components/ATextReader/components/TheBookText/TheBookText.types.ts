import type { BookNode } from '@ValenceClient/books/readBookDocument.types';

type TheBookTextProps = {
  nodes: readonly BookNode[];
  size: number;
  leading: number;
  ink: string;
  onLink: (href: string) => void;
  onAnchors: (anchors: ReadonlyMap<string, number>) => void;
};

export type { TheBookTextProps };
