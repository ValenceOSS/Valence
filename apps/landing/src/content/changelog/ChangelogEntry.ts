type ChangelogPicture = {
  src: string;
  alt: string;
};

type ChangelogSection = {
  title: string;
  body: string;
  picture?: ChangelogPicture;
};

type ChangelogList = {
  title: string;
  items: string[];
};

type ChangelogEntry = {
  slug: string;
  version: string;
  date: string;
  title: string;
  summary: string;
  picture?: ChangelogPicture;
  sections: ChangelogSection[];
  lists: ChangelogList[];
};

export type { ChangelogEntry, ChangelogList, ChangelogPicture, ChangelogSection };
