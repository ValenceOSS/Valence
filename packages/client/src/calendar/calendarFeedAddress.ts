/**
 * Where a calendar app reads the release calendar from, for a link's token: on this server, or,
 * asked for as a subscription, the same address under `webcal:`, which a calendar app opens itself.
 *
 * @param token - The link's token.
 * @param origin - Where this server is reached.
 * @param asSubscription - Whether to write it for a calendar app to open.
 * @returns The address.
 */
const calendarFeedAddress = (token: string, origin: string, asSubscription = false): string => {
  const address = `${origin.replace(/\/+$/, '')}/api/calendar/feed/${encodeURIComponent(token)}.ics`;

  return asSubscription ? address.replace(/^https?:/, 'webcal:') : address;
};

export { calendarFeedAddress };
