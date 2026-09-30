import type { RefusalBody } from './RefusalBody';
import type { Said } from './SaidSchema';

/**
 * What a refusal said, as something that can be said again or carried inside something else.
 *
 * @param refusal - The body of the refusal.
 */
const saidFrom = ({ error, code, values }: RefusalBody): Said => ({ code, message: error, values });

export { saidFrom };
