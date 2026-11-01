import { execFileSync } from 'node:child_process';
import { hostname } from 'node:os';

const ASKING_FOR_MS = 2000;

const LOCAL_SUFFIX = /\.local$/u;

/**
 * Asks a Mac for the name in its sharing settings.
 *
 * @returns The name, or nothing where the Mac would not say.
 */
const askTheMac = (): string => {
  try {
    return execFileSync('scutil', ['--get', 'ComputerName'], {
      encoding: 'utf8',
      timeout: ASKING_FOR_MS,
    }).trim();
  } catch {
    return '';
  }
};

/**
 * What this computer is called, the way its owner named it: on a Mac the name in its sharing
 * settings, such as "Dan’s MacBook Pro", which its network name spells without the apostrophe, and
 * elsewhere the name the system gives it on the network.
 *
 * @param system - Which system this is.
 * @returns The name, or nothing where the system gives none.
 */
const theComputersName = (system: NodeJS.Platform = process.platform): string | null => {
  const named = system === 'darwin' ? askTheMac() : '';

  if (named !== '') {
    return named;
  }

  const host = hostname().replace(LOCAL_SUFFIX, '').trim();

  return host === '' ? null : host;
};

export { theComputersName };
