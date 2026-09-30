import type { RefusalBody } from './RefusalBody';

/**
 * Only the body of a refusal, from one that carries more beside it, such as the status it is sent
 * with.
 *
 * @param refusal - The refusal.
 */
const bodyOf = ({ error, code, values }: RefusalBody): RefusalBody => ({ error, code, values });

export { bodyOf };
