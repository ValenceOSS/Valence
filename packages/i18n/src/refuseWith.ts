import type { RefusalBody } from './RefusalBody';
import type { Said } from './SaidSchema';

/**
 * The body a server answers with when it refuses for a reason it already holds as something said,
 * such as a problem a download client reported.
 *
 * @param said - Why it refuses.
 */
const refuseWith = (said: Said): RefusalBody => ({
  error: said.message,
  code: said.code,
  values: said.values,
});

export { refuseWith };
