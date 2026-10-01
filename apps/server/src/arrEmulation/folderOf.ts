type ArrTitle = {
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
};

/**
 * The folder Radarr and Sonarr would keep a title in: its name and, where known, its year.
 *
 * @param title - The title.
 * @returns The folder's name.
 */
const folderOf = (title: Pick<ArrTitle, 'title' | 'year'>): string =>
  title.year === null ? title.title : `${title.title} (${title.year.toString()})`;

export { folderOf };

export type { ArrTitle };
