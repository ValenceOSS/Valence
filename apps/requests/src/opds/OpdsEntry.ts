type OpdsLink = { href: string; type: string; length: number | null };

type OpdsEntry = {
  id: string;
  title: string;
  authors: string[];
  updatedAt: string | null;
  infoUrl: string | null;
  acquisitions: OpdsLink[];
};

type OpdsFeed = {
  searchLink: { href: string; type: string } | null;
  entries: OpdsEntry[];
  bookFeeds: string[];
};

export type { OpdsEntry, OpdsFeed, OpdsLink };
