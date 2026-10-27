/**
 * Whether a host is one of those listed, where a listing that starts `*.` stands for every host
 * under that name but not the name itself, so `*.files.example.com` lets in `eu1.files.example.com`
 * and keeps out `files.example.com` and `evil-files.example.com`.
 *
 * @param hostname - The host an address names.
 * @param listed - The hosts allowed, each written out in full or as a `*.` pattern.
 * @returns Whether the host is allowed.
 */
const isHostAllowed = (hostname: string, listed: readonly string[]): boolean => {
  const host = hostname.toLowerCase().replace(/\.$/, '');

  return listed.some((entry) => {
    const allowed = entry.toLowerCase();

    return allowed.startsWith('*.') ? host.endsWith(allowed.slice(1)) : host === allowed;
  });
};

export { isHostAllowed };
