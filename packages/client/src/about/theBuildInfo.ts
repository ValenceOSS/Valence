import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { BuildInfo } from '@ValenceClient/platform/Platform.types';

/**
 * What this client is actually running, for whoever needs to say so before filing a bug.
 *
 * Only a packaged client has a version worth reporting — a browser tab is whatever origin served
 * it, and the question does not apply. `null` there is the honest answer, not a missing one.
 *
 * @returns The version and runtime this client was built with, or `null` where there is none to give.
 */
const theBuildInfo = (): BuildInfo | null => platformInUse().buildInfo();

export { theBuildInfo };
