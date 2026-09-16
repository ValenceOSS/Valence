import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { clearException, setException } from '@ValenceClient/admin/fetchLibraryAccess';
import { hidingSubjectOf } from '@ValenceClient/library/hidingSubjectOf';
import type { DecideForSomebodyProps } from './DecideForSomebody.types';

/**
 * Decides, for one film or programme, who may watch it whatever their age limit says.
 *
 * This is where a parent actually is when they decide — looking at the thing, having read what it
 * is — rather than in a settings panel organised by account, where choosing a film would mean
 * searching for it again.
 *
 * It decides about the programme rather than the episode wherever there is one, for the reason
 * hiding does: granting one episode of a series is almost never what anybody means.
 *
 * Every account is offered, not only the limited ones. An allow against an account with no limit
 * does nothing until one is set, which is harmless; a deny works immediately whether or not there
 * is a limit, because a denial beats everything — and "keep this from them" is a thing somebody may
 * reasonably want without setting a limit at all.
 *
 * @param about - What is being decided, or nothing while the dialog is shut.
 * @param onClose - Told to shut it.
 */
const DecideForSomebody = ({ about, onClose }: DecideForSomebodyProps) => {
  const cache = useQueryClient();
  const accounts = useQuery(adminQueries.accounts()).data ?? [];

  const subject =
    about === null
      ? null
      : (({ kind, subjectId }) => ({ kind, subjectId }))(hidingSubjectOf(about));

  const title = about === null ? '' : hidingSubjectOf(about).title;
  const standing = useQuery(adminQueries.exceptionsOn(subject)).data ?? [];

  const decide = (accountId: string, effect: 'allow' | 'deny' | null) => {
    if (subject === null) {
      return;
    }

    const done =
      effect === null
        ? clearException(accountId, subject)
        : setException(accountId, subject, effect);

    void done.then(async () => cache.invalidateQueries({ queryKey: adminQueries.key }));
  };

  return (
    <DialogCompanion label="Who may watch this" isOpen={about !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={`Who may watch ${title}`}
        detail="Decided one account at a time, whatever age limit that account has. A denial always wins."
      />

      <DialogContent className="flex flex-col gap-2">
        {accounts.length === 0 ? (
          <p className="text-sm text-text-muted">There are no other accounts on this server.</p>
        ) : (
          accounts.map((account) => {
            const said = standing.find((one) => one.accountId === account.id)?.effect ?? null;

            return (
              <div key={account.id} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-text">{account.name}</span>

                {said === null ? null : <Badge size="sm">{said}</Badge>}

                <Button
                  variant={said === 'allow' ? 'glossy' : 'ghost'}
                  size="sm"
                  aria-pressed={said === 'allow'}
                  label={`Allow ${title} for ${account.name}`}
                  onClick={() => {
                    decide(account.id, said === 'allow' ? null : 'allow');
                  }}
                >
                  Allow
                </Button>

                <Button
                  variant={said === 'deny' ? 'glossy' : 'ghost'}
                  size="sm"
                  aria-pressed={said === 'deny'}
                  label={`Deny ${title} for ${account.name}`}
                  onClick={() => {
                    decide(account.id, said === 'deny' ? null : 'deny');
                  }}
                >
                  Deny
                </Button>
              </div>
            );
          })
        )}
      </DialogContent>
    </DialogCompanion>
  );
};

DecideForSomebody.displayName = 'DecideForSomebody';

export { DecideForSomebody };
