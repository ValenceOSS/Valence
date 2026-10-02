import { sayAgain } from '@ValenceI18n/sayAgain';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import type { EmailKind } from '@ValenceContracts/schemas/EmailSend';
import type { RecentEmailsProps } from './RecentEmails.types';
import { say } from '@ValenceI18n/say';

const KIND_WORDS: Record<EmailKind, string> = {
  setupLink: say('screens.adminArea.emailCard.recentEmails.setupLink'),
  passwordReset: say('screens.adminArea.emailCard.recentEmails.passwordReset'),
  test: say('screens.adminArea.emailCard.recentEmails.testEmail'),
};

/**
 * The emails Valence tried lately, newest first: what each was, who it went to, when, and whether it
 * went — with the mail server's reason beside any that did not, so a failure is never quiet.
 *
 * @param sends - The latest emails tried.
 * @param now - The moment their ages are counted from.
 */
const RecentEmails = ({ sends, now }: RecentEmailsProps) => (
  <div className="flex flex-col gap-2">
    <h3 className="font-body text-sm font-semibold text-text">
      {say('screens.adminArea.emailCard.recentEmails.recentEmails')}
    </h3>

    {sends.length === 0 ? (
      <p className="font-body text-[0.8125rem] text-text-muted">
        {say('screens.adminArea.emailCard.recentEmails.nothingHasBeenSentYet')}
      </p>
    ) : (
      <ul className="flex flex-col divide-y divide-border">
        {sends.map((send) => (
          <li key={send.id} className="flex flex-col gap-0.5 py-2">
            <span className="flex items-baseline gap-2 font-body text-sm">
              <span className="font-medium text-text">{KIND_WORDS[send.kind]}</span>
              <span className="min-w-0 truncate text-text-muted">{send.recipient}</span>
              <span className="ml-auto shrink-0 text-xs tabular-nums text-text-muted">
                {describeSince(send.createdAt, now)}
              </span>
            </span>

            {send.state === 'sent' ? (
              <span className="font-body text-xs text-text-muted">
                {say('screens.adminArea.emailCard.recentEmails.sent')}
              </span>
            ) : (
              <span className="font-body text-xs text-danger">
                {say('screens.adminArea.emailCard.recentEmails.failedBecause', {
                  reason:
                    send.failure === null
                      ? say('screens.adminArea.emailCard.recentEmails.noReasonGiven')
                      : sayAgain(send.failure),
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

RecentEmails.displayName = 'RecentEmails';

export { RecentEmails };
