type BookNode =
  | { kind: 'text'; text: string }
  | {
      kind: 'element';
      tag: string;
      attributes: Readonly<Record<string, string>>;
      children: readonly BookNode[];
    };

export type { BookNode };
