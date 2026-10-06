import 'core-js/stable';
import type { fillTheGaps as onTheTelevision } from '@ValenceTv/platform/fillTheGaps';

/**
 * Fills in what a television's browser lacks: the built-ins newer than the browser engines televisions
 * ship, which can be years old, come from core-js as soon as this file loads, before anything uses them.
 */
const fillTheGaps: typeof onTheTelevision = () => undefined;

export { fillTheGaps };
