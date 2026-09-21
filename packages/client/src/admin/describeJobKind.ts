import { describeWords } from './describeWords';

const SCHEDULED = '.scheduled';

/**
 * Says what a kind of job is in words. A kind the server offers to run is called what the server
 * calls it; the copy of one that runs on its clock carries the same name and says so; and any other
 * is put into words from its own identifier — `library.readAgain` is "Read again" — rather than
 * shown as the code it is.
 *
 * @param kind - The kind of job, as the server writes it.
 * @param labels - What the server calls each kind it offers to run, keyed by kind.
 * @returns The kind, in words.
 */
const describeJobKind = (kind: string, labels: ReadonlyMap<string, string>): string => {
  const known = labels.get(kind);

  if (known !== undefined) {
    return known;
  }

  if (kind.endsWith(SCHEDULED)) {
    return `${describeJobKind(kind.slice(0, -SCHEDULED.length), labels)} (on its schedule)`;
  }

  const words = describeWords(kind.slice(kind.lastIndexOf('.') + 1));

  return words === '' ? kind : words;
};

export { describeJobKind };
