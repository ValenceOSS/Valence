import { z } from 'zod';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';

const MailErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  response: z.string().optional(),
});

const UNREACHABLE = new Set(['ECONNECTION', 'ESOCKET', 'ETIMEDOUT', 'EDNS', 'ECONNREFUSED']);

/**
 * Says why an email could not be sent, from what nodemailer threw: the mail server unreachable, a
 * sign-in it refused, or whatever else it answered, in its own words.
 *
 * @param thrown - What the send threw, as an error.
 * @param host - The mail server it was sent through.
 * @returns The reason, to record and to show an administrator.
 */
const describeSendFailure = (thrown: Error, host: string): Said => {
  const error = MailErrorSchema.safeParse(thrown);
  const code = error.success ? error.data.code : undefined;
  const answer = error.success ? (error.data.response ?? thrown.message) : thrown.message;

  if (code !== undefined && UNREACHABLE.has(code)) {
    return saying('server.email.describeSendFailure.couldNotReachTheMailServer', { host });
  }

  if (code === 'EAUTH') {
    return saying('server.email.describeSendFailure.theMailServerRefusedTheSignIn', { host });
  }

  if (answer === '') {
    return saying('server.email.describeSendFailure.theEmailCouldNotBeSent');
  }

  return saying('server.email.describeSendFailure.theMailServerAnswered', {
    answer: sayVerbatim(answer),
  });
};

export { describeSendFailure };
