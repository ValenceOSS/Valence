import { isTheDesktopClient } from '@ValenceScreens/desktop/theDesktopShell';
import { discordLookOf } from '@ValenceScreens/playback/discordLookOf';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';
import type { WhatIsBeingDone } from '@ValenceScreens/desktop/theDesktopShell';

/**
 * What Discord is told while nothing that may be shown is playing: that somebody is browsing, where
 * they asked for that, or nothing at all, which takes the status down.
 *
 * @param isAllowed - Whether they asked for anything to be shown on Discord.
 * @param presence - Their Discord settings.
 * @returns The status to show, or nothing.
 */
const theIdleStatus = (isAllowed: boolean, presence: DiscordPresence): WhatIsBeingDone | null =>
  isAllowed && presence.showsBrowsing && isTheDesktopClient()
    ? { kind: 'browsing', look: discordLookOf(presence) }
    : null;

export { theIdleStatus };
