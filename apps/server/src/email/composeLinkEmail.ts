import { say } from '@ValenceI18n/say';
import { formatEmailDate } from './formatEmailDate';
import type { EmailContent } from './EmailContent';

type LinkEmailKind = 'setupLink' | 'passwordReset';

/**
 * Words an email carrying a link — an account's setup link, or a password reset — saying who it is
 * from, what the link does and when it stops working.
 *
 * @param kind - Which link it carries.
 * @param link - Who it is for, the link, when it expires and which server sent it.
 * @param timeZone - The zone to give the expiry in, the server's own when not given.
 * @returns What the email says.
 */
const composeLinkEmail = (
  kind: LinkEmailKind,
  link: { name: string; url: string; expiresAt: Date; server: string },
  timeZone?: string,
): EmailContent => {
  const { name, url, expiresAt, server } = link;
  const expires = say('server.email.composeLinkEmail.theLinkWorksOnceUntil', {
    expiresAt: formatEmailDate(expiresAt, timeZone),
  });

  if (kind === 'setupLink') {
    return {
      subject: say('server.email.composeLinkEmail.yourAccountOn', { server }),
      heading: say('server.email.composeLinkEmail.welcomeName', { name }),
      paragraphs: [say('server.email.composeLinkEmail.serverMadeYouAnAccount', { server })],
      action: { label: say('server.email.composeLinkEmail.setUpYourAccount'), url },
      afterAction: [expires],
    };
  }

  return {
    subject: say('server.email.composeLinkEmail.resetYourPasswordOn', { server }),
    heading: say('server.email.composeLinkEmail.helloName', { name }),
    paragraphs: [say('server.email.composeLinkEmail.somebodyAskedToReset', { server })],
    action: { label: say('server.email.composeLinkEmail.chooseANewPassword'), url },
    afterAction: [expires, say('server.email.composeLinkEmail.ifYouDidNotAsk')],
  };
};

export { composeLinkEmail };
