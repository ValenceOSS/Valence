/**
 * The headers a channel's stream is asked for with: the user agent and referrer its playlist said
 * it insists on, where it said so.
 *
 * @param asking - What the channel insists on.
 * @returns The headers.
 */
const headersFor = (asking: {
  userAgent: string | null;
  referrer: string | null;
}): Record<string, string> => ({
  ...(asking.userAgent === null ? {} : { 'user-agent': asking.userAgent }),
  ...(asking.referrer === null ? {} : { referer: asking.referrer }),
});

export { headersFor };
