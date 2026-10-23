import type { Logger } from '@ValenceServer/logging/Logger';
import type { EmailOutcome } from './EmailService';

type ResetLink = { email: string; url: string; outcome: EmailOutcome };

type HandOverTo = {
  log: Pick<Logger, 'info'>;
  toConsole: (line: string) => void;
};

/**
 * Notes in the log that a password reset was asked for, and gives the link itself to whoever runs the
 * server only where it was not emailed, on the console alone.
 *
 * The log is read in the admin area by anybody holding `server.logs`, which a Manager does, and a
 * reset can be asked for on anybody's behalf: a link written there would let a Manager reset the
 * administrator's password. The console is only read by whoever runs the machine.
 *
 * @param link - Who asked, the link, and how emailing it went.
 * @param to - The log, and a way of writing a line to the console that the log does not keep.
 */
const handOverResetLink = ({ email, url, outcome }: ResetLink, { log, toConsole }: HandOverTo) => {
  log.info('auth', `password reset asked for ${email}`);

  if (outcome.kind !== 'sent') {
    toConsole(`password reset link for ${email}: ${url}\n`);
  }
};

export { handOverResetLink };
