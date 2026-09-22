import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * Whether this client can show what somebody is watching in their Discord status.
 *
 * Only the desktop client reaches Discord — it runs a socket to whatever Discord is open on the
 * same machine, which a browser tab has no way to do. Offering the setting anywhere else would be
 * offering a switch that does nothing, or worse, one that reads as broken when Discord never hears
 * about it.
 *
 * @returns Whether to offer the setting at all.
 */
const canShowOnDiscord = (): boolean => platformInUse().thisClientKind() === 'desktop';

export { canShowOnDiscord };
