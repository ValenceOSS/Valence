import { possessiveOf } from '@ValenceCore/functions/possessiveOf';
import { say } from '@ValenceI18n/say';

/**
 * What to call somebody watching on a link, on a screen listing who is watching.
 *
 * Named after whoever's link it is, because that is the only thing anybody knows about them: a
 * guest signs in as nobody, and the one fact worth showing an administrator is who let them in.
 *
 * @param invitedBy - The name of whoever made the link, where it is known.
 * @returns What to call them.
 */
const describeGuest = (invitedBy: string | null): string => {
  const whose = invitedBy === null ? '' : possessiveOf(invitedBy);

  return whose === ''
    ? say('core.describeGuest.aGuest')
    : say('core.describeGuest.whose', { whose });
};

export { describeGuest };
