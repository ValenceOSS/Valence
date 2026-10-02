import { say } from '@ValenceI18n/say';
import type { EmailContent } from './EmailContent';

/**
 * Words the email an administrator sends from Settings to check email works.
 *
 * @param server - Which server sent it.
 * @returns What the email says.
 */
const composeTestEmail = (server: string): EmailContent => ({
  subject: say('server.email.composeTestEmail.emailFromValenceWorks'),
  heading: say('server.email.composeTestEmail.emailFromValenceWorks'),
  paragraphs: [say('server.email.composeTestEmail.thisIsTheTest', { server })],
  action: null,
  afterAction: [],
});

export { composeTestEmail };
