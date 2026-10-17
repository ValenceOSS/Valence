const SECRET = /key|pass|token|auth|secret|sig|uid|cookie/i;

/**
 * An address an indexer was asked at, fit for the log: every parameter whose name says it carries a
 * key, a passkey or a token is masked, so a private tracker's credentials never reach the log.
 *
 * @param address - The address asked.
 * @returns It with its secrets masked, or as given where it is not an address.
 */
const addressToLog = (address: string): string => {
  if (!URL.canParse(address)) {
    return address;
  }

  const url = new URL(address);

  for (const name of url.searchParams.keys()) {
    if (SECRET.test(name)) {
      url.searchParams.set(name, '***');
    }
  }

  return decodeURIComponent(url.toString());
};

export { addressToLog };
