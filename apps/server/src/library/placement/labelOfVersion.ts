import { pathParts } from './pathParts';

const EDGES = /^[\s._\-–—[\]()]+|[\s._\-–—[\]()]+$/gu;

/**
 * Names one version of a film or episode by what its file name says beyond the name they share —
 * `1080p`, `Director's Cut` — or by its whole name where it shares none.
 *
 * @param path - The version's file.
 * @param shared - The name the versions share.
 * @returns What to call the version.
 */
const labelOfVersion = (path: string, shared: string): string => {
  const { stem } = pathParts(path);
  const rest = stem.toLowerCase().startsWith(shared.toLowerCase())
    ? stem.slice(shared.length)
    : stem;
  const label = rest.replaceAll(EDGES, '').trim();

  return label === '' ? stem : label;
};

export { labelOfVersion };
