/**
 * Whether two addresses name the same place, whatever case the host is written in and whether
 * either ends with a slash.
 *
 * @param left - One address.
 * @param right - The other.
 * @returns Whether they are the same.
 */
const sameAddress = (left: string, right: string): boolean => {
  const tidy = (address: string) => {
    try {
      const url = new URL(address);

      return `${url.protocol}//${url.host.toLowerCase()}${url.pathname.replace(/\/+$/, '')}${url.search}`;
    } catch {
      return address.trim().replace(/\/+$/, '').toLowerCase();
    }
  };

  return tidy(left) === tidy(right);
};

export { sameAddress };
