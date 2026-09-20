type ArrivedItem = {
  title: string;
  seriesTitle: string | null;
};

type ArrivedTitle = {
  title: string;
  episodes: number;
};

type SummarisedArrivals = {
  listed: ArrivedTitle[];
  notListed: number;
};

/**
 * Gathers what a scan brought in under the titles it belongs to, so a notification names programmes
 * rather than reciting episodes.
 *
 * A scan of a drive full of television adds thousands of files and every one of them is an episode
 * of something. Listing them names twenty-five episodes of whichever programme sorted first and
 * says nothing at all about the rest, which is a worse answer than naming the programmes and saying
 * how much of each arrived.
 *
 * Grouped by the programme's title rather than by its identifier, because that is what a scan hands
 * back — and two programmes sharing a title in one library would be indistinguishable to somebody
 * reading the notification anyway.
 *
 * The fullest titles come first, so what is cut is what somebody was least likely to be waiting for.
 *
 * @param items - Everything the scan added.
 * @param keep - How many titles the notification has room for.
 * @returns The titles to name, and how many more there were.
 */
const summariseArrivals = (items: ArrivedItem[], keep: number): SummarisedArrivals => {
  const titles = new Map<string, ArrivedTitle>();

  for (const item of items) {
    const series = item.seriesTitle ?? '';
    const name = series === '' ? item.title : series;
    const held = titles.get(name);

    titles.set(name, { title: name, episodes: (held?.episodes ?? 0) + 1 });
  }

  const ordered = [...titles.values()].sort(
    (first, second) => second.episodes - first.episodes || first.title.localeCompare(second.title),
  );

  return {
    listed: ordered.slice(0, Math.max(keep, 0)),
    notListed: Math.max(ordered.length - Math.max(keep, 0), 0),
  };
};

export type { ArrivedItem, ArrivedTitle, SummarisedArrivals };

export { summariseArrivals };
