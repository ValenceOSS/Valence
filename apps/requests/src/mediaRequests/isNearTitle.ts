import { reduceTitle } from '@ValenceRequests/mediaRequests/reduceTitle';

/**
 * Whether a release's title is near enough to what was asked for to trust an indexer that found it
 * by the title's id: the same title, or one of them the other with words added, such as "The Office
 * US" for "The Office".
 *
 * @param released - The title a release name gives.
 * @param wanted - The title asked for.
 * @returns Whether it is near enough.
 */
const isNearTitle = (released: string, wanted: string): boolean => {
  const reduced = reduceTitle(released);
  const asked = reduceTitle(wanted);

  return (
    reduced !== '' &&
    asked !== '' &&
    (reduced === asked || reduced.startsWith(`${asked} `) || asked.startsWith(`${reduced} `))
  );
};

export { isNearTitle };
