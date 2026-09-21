type NamedBook = { key: string; title: string };

type CatalogueLookup = {
  films: (tmdbIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  series: (tmdbIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  artists: (musicBrainzIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  albums: (releaseGroupIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  artistsNamed: (nameKeys: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  albumsNamed: (titleKeys: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  booksNamed: (books: readonly NamedBook[]) => Promise<ReadonlyMap<string, string>>;
};

export type { CatalogueLookup, NamedBook };
