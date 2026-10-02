import type { SmtpServer } from './EmailConnection';

const SMTPS_PORT = 465;

const SMTP_PORT = 587;

/**
 * Reads a mail server from an address like `smtps://user:pass@host:465`, where `smtps` means TLS from
 * the start, `smtp` means upgrading with STARTTLS, and `?security=none` sends without encryption.
 *
 * @param address - The address, as an operator wrote it.
 * @returns The mail server, or `null` when the address is not one.
 */
const parseSmtpUrl = (address: string): SmtpServer | null => {
  if (!URL.canParse(address.trim())) {
    return null;
  }

  const url = new URL(address.trim());
  const isSmtps = url.protocol === 'smtps:';

  if ((!isSmtps && url.protocol !== 'smtp:') || url.hostname === '') {
    return null;
  }

  const isPlain = url.searchParams.get('security') === 'none';

  return {
    host: url.hostname,
    port: url.port === '' ? (isSmtps ? SMTPS_PORT : SMTP_PORT) : Number(url.port),
    security: isSmtps ? 'tls' : isPlain ? 'none' : 'starttls',
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
};

export { parseSmtpUrl };
