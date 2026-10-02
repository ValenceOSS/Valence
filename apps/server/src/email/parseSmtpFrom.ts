const NAMED_ADDRESS = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/;

/**
 * Splits who an email is from, written either as a bare address or as `Name <address>`.
 *
 * @param from - What the operator wrote.
 * @returns The name, empty when none was given, and the address.
 */
const parseSmtpFrom = (from: string): { name: string; address: string } => {
  const named = NAMED_ADDRESS.exec(from);

  if (named === null) {
    return { name: '', address: from.trim() };
  }

  return { name: (named[1] ?? '').trim(), address: (named[2] ?? '').trim() };
};

export { parseSmtpFrom };
