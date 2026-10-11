/**
 * Where a channel's logo is read from, through the server, addressed afresh whenever how logos
 * are fetched changes, so a browser does not keep showing one it was refused before.
 *
 * @param id - The channel.
 * @returns The address.
 */
const liveChannelLogoUrl = (id: string): string =>
  `/api/live/channels/${encodeURIComponent(id)}/logo?v=2`;

export { liveChannelLogoUrl };
