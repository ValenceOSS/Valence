import { reduceTitle } from '@ValenceRequests/mediaRequests/reduceTitle';

/**
 * Whether a release's title names what was asked for, spelled however the release spelled it.
 *
 * @param released - The title a release name gives.
 * @param wanted - The title asked for.
 * @returns Whether they are the same.
 */
const isSameTitle = (released: string, wanted: string): boolean => {
  const reduced = reduceTitle(released);

  return reduced !== '' && reduced === reduceTitle(wanted);
};

export { isSameTitle };
