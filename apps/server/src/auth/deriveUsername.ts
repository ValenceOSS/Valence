import { MAXIMUM_USERNAME_LENGTH } from '@ValenceContracts/constants/MAXIMUM_USERNAME_LENGTH';
import { MINIMUM_USERNAME_LENGTH } from '@ValenceContracts/constants/MINIMUM_USERNAME_LENGTH';
import { NO_EMAIL_DOMAIN } from '@ValenceContracts/constants/NO_EMAIL_DOMAIN';

type NamedAccount = {
  name: string;
  email: string;
};

const FALLBACK_USERNAME = 'viewer';

/**
 * Folds text into what a username may hold: lower case letters, digits, dots and underscores, with
 * accents dropped and any other run of characters read as one dot.
 *
 * @param text - The text to fold.
 * @returns The folded text, which may be empty.
 */
const fold = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, MAXIMUM_USERNAME_LENGTH);

/**
 * Chooses a username for an account that has none, from its address before the @ or else its name,
 * numbered where that is taken or too short, and never one already in use.
 *
 * @param account - The account's name and address.
 * @param taken - Every username already in use, in lower case.
 * @returns A username better-auth will accept and nobody else holds.
 */
const deriveUsername = (account: NamedAccount, taken: ReadonlySet<string>): string => {
  const isPlaceholder = account.email.toLowerCase().endsWith(`@${NO_EMAIL_DOMAIN}`);
  const fromAddress = isPlaceholder ? '' : fold(account.email.split('@')[0] ?? '');
  const base = [fromAddress, fold(account.name)].find((one) => one !== '') ?? FALLBACK_USERNAME;

  if (base.length >= MINIMUM_USERNAME_LENGTH && !taken.has(base)) {
    return base;
  }

  for (let number = 1; ; number += 1) {
    const suffix = number.toString().padStart(MINIMUM_USERNAME_LENGTH - base.length, '0');
    const candidate = `${base.slice(0, MAXIMUM_USERNAME_LENGTH - suffix.length)}${suffix}`;

    if (!taken.has(candidate)) {
      return candidate;
    }
  }
};

export type { NamedAccount };

export { deriveUsername };
