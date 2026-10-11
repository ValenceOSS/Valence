/**
 * Where a channel's logo is read from, through the server.
 *
 * @param id - The channel.
 * @returns The address.
 */
const liveChannelLogoUrl = (id: string): string =>
  `/api/live/channels/${encodeURIComponent(id)}/logo`;

export { liveChannelLogoUrl };
