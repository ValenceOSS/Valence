import type { AllowedApps } from '@ValenceContracts/schemas/AllowedApps';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';

/**
 * The apps an administrator has turned off, from the switches they set. The web is never among
 * them: it is what an administrator reaches the switches with.
 *
 * @param allowed - Which apps may connect.
 * @returns The ones that may not.
 */
const closedAppsIn = (allowed: AllowedApps): ClientKind[] =>
  (['desktop', 'phone', 'tv'] as const).filter((app) => !allowed[app]);

export { closedAppsIn };
