/**
 * Whether an address is on the same origin as the one configured, or the same host moved to HTTPS
 * on its standard port, which is what a mirror that redirects plain HTTP to HTTPS does.
 *
 * @param configured - The address the administrator configured.
 * @param candidate - The address being considered.
 * @returns Whether it is the configured host.
 */
const isSameOriginOrUpgrade = (configured: string, candidate: string): boolean => {
  const base = URL.parse(configured);
  const other = URL.parse(candidate);

  if (base === null || other === null) {
    return false;
  }

  return (
    base.origin === other.origin ||
    (base.protocol === 'http:' &&
      other.protocol === 'https:' &&
      other.port === '' &&
      base.hostname === other.hostname)
  );
};

export { isSameOriginOrUpgrade };
