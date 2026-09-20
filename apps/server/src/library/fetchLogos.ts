type LogolessItem = {
  id: string;
  externalId: string;
  isSeries: boolean;
};

type FetchLogosOptions = {
  libraryId: string;
  store: {
    listMissing: (libraryId: string) => Promise<LogolessItem[]>;
    save: (mediaItemIds: string[], logoUrl: string) => Promise<void>;
  };
  readLogoUrl?: (options: { externalId: string; isSeries: boolean }) => Promise<string | null>;
  onProblem?: (mediaItemId: string, reason: string) => void;
  onProgress?: (done: number, total: number) => void;
  isCancelled?: () => Promise<boolean> | boolean;
};

type FetchLogosResult = {
  found: number;
  missing: number;
};

type Title = {
  externalId: string;
  isSeries: boolean;
  firstId: string;
  ids: string[];
};

/**
 * Gathers what a library is missing logos for into the titles those things belong to.
 *
 * A logo is a title's lettering, and the catalogue holds one per title — an episode has no logo of
 * its own, it has its series'. Every episode of a series therefore carries the same catalogue
 * identifier, and working through the files rather than the titles asks one question several
 * hundred times to be told the same answer.
 *
 * A film is a title on its own and comes out of here as a group of one, so nothing about films
 * changes.
 *
 * @param items - Everything in the library with no logo yet.
 * @returns One entry per title, each holding everything that wants that title's logo.
 */
const byTitle = (items: LogolessItem[]): Title[] => {
  const titles = new Map<string, Title>();

  for (const item of items) {
    const key = `${item.isSeries ? 'series' : 'film'}:${item.externalId}`;
    const held = titles.get(key);

    if (held === undefined) {
      titles.set(key, {
        externalId: item.externalId,
        isSeries: item.isSeries,
        firstId: item.id,
        ids: [item.id],
      });
    } else {
      held.ids.push(item.id);
    }
  }

  return [...titles.values()];
};

/**
 * Fetches the logo each title is written in — the lettering as its designer set it — for the titles
 * of a library that have none yet, and writes it against everything that title covers.
 *
 * Asked once per title and counted in titles, because that is the shape of the work: a series of
 * ninety episodes is one logo to find, not ninety, and a run that reports ninety is describing the
 * files it is writing to rather than the questions it is asking.
 *
 * Runs as its own job rather than during a scan, since it is a request per title and a scan is slow
 * enough already.
 *
 * @param options - The library to work through, the providers to ask, and where to report progress.
 * @returns How many titles a logo was found for, and how many had none.
 */
const fetchLogos = async ({
  libraryId,
  store,
  readLogoUrl,
  onProblem,
  onProgress,
  isCancelled,
}: FetchLogosOptions): Promise<FetchLogosResult> => {
  if (readLogoUrl === undefined) {
    return { found: 0, missing: 0 };
  }

  const wanted = byTitle(await store.listMissing(libraryId));

  let found = 0;
  let missing = 0;

  onProgress?.(0, wanted.length);

  for (const [at, title] of wanted.entries()) {
    if ((await isCancelled?.()) === true) {
      break;
    }

    try {
      const url = await readLogoUrl({ externalId: title.externalId, isSeries: title.isSeries });

      if (url === null) {
        missing += 1;
      } else {
        await store.save(title.ids, url);
        found += 1;
      }
    } catch (cause) {
      missing += 1;
      onProblem?.(
        title.firstId,
        cause instanceof Error ? cause.message : 'The catalogue did not answer.',
      );
    }

    onProgress?.(at + 1, wanted.length);
  }

  return { found, missing };
};

export type { LogolessItem };

export { fetchLogos };
