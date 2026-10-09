import type { SeriesFile } from '@ValenceServer/requests/catalogue/SeriesFile';
import type { HeldTitle } from '@ValenceServer/requests/titles/HeldTitle';
import type { TitleFiles } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';

type NamedBook = { key: string; title: string };

type CatalogueLookup = {
  films: (tmdbIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  series: (tmdbIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  episodesHeld: (tmdbId: string) => Promise<ReadonlyMap<number, number>>;
  seriesFiles: (tmdbId: string) => Promise<readonly SeriesFile[]>;
  heldTitles: () => Promise<HeldTitle[]>;
  titleFiles: (kind: MediaRequestKind, catalogueId: string) => Promise<TitleFiles>;
  artists: (musicBrainzIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  albums: (releaseGroupIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  albumQualities: (
    releaseGroupIds: readonly string[],
  ) => Promise<ReadonlyMap<string, MusicQuality>>;
  seriesNarrators: (series: string) => Promise<readonly string[]>;
  artistsNamed: (nameKeys: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  albumsNamed: (titleKeys: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  booksNamed: (books: readonly NamedBook[]) => Promise<ReadonlyMap<string, string>>;
  elsewhere: (
    tmdbIds: readonly string[],
  ) => Promise<ReadonlyMap<string, { mediaId: string; fromServer: string }>>;
};

export type { CatalogueLookup, NamedBook };
