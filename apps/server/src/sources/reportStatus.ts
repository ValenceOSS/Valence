import { nameOfSource } from './nameOfSource';
import { troubleFromStatus } from './troubleFromStatus';
import { troubleWatch } from './troubleWatch';

/**
 * Tells whoever is listening that a site answered with trouble, where its status means trouble
 * rather than that it has nothing.
 *
 * @param url - An address on the site.
 * @param status - What it answered with.
 */
const reportStatus = (url: string, status: number): void => {
  const reason = troubleFromStatus(status);

  if (reason !== null) {
    troubleWatch.report({ source: nameOfSource(url), reason });
  }
};

export { reportStatus };
