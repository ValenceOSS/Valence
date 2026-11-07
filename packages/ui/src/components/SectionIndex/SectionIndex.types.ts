type SectionIndexEntry = {
  id: string;
  label: string;
  note?: string;
};

type SectionIndexProps = {
  label: string;
  sections: readonly SectionIndexEntry[];
  className?: string;
};

export type { SectionIndexEntry, SectionIndexProps };
