import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { clearException, setException } from '@ValenceClient/admin/fetchLibraryAccess';
import { hidingSubjectOf } from '@ValenceClient/library/hidingSubjectOf';
import { useShell } from '@ValenceClient/shell/useShell';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import type { DecideForSomebodyProps } from './DecideForSomebody.types';

const CHOICES = [
  { id: 'allow', label: 'Allow' },
  { id: 'none', label: 'Their limit' },
  { id: 'deny', label: 'Deny' },
] as const;

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
 * Whoever is deciding is not in the list. Nobody needs an exception against themselves, and taking
 * something out of your own view is what hiding is for — it is on the same dialog this was opened
 * from. Administrators are left out for a harder reason: a limit does not apply to them at all, so
 * both controls would sit there doing nothing.
 *
 * The middle choice is the real one and is drawn as such. An account usually has no exception either
 * way, and a pair of buttons with neither pressed says nothing about which state that is.
 *
 * @param about - What is being decided, or nothing while the dialog is shut.
 * @param onClose - Told to shut it.
 */
const DecideForSomebody = ({ about, onClose }: DecideForSomebodyProps) => {
  const cache = useQueryClient();
  const { user } = useShell();
  const everybody = useQuery(adminQueries.accounts()).data ?? [];

  const accounts = everybody.filter(
    (account) => account.id !== user.id && !account.isAdministrator,
  );

  const asked = about === null ? null : hidingSubjectOf(about);
  const subject = asked === null ? null : { kind: asked.kind, subjectId: asked.subjectId };
  const title = asked?.title ?? '';
  const standing = useQuery(adminQueries.exceptionsOn(subject)).data ?? [];

  const decide = (accountId: string, chosen: string) => {
    if (subject === null) {
      return;
    }

    const done =
      chosen === 'none'
        ? clearException(accountId, subject)
        : setException(accountId, subject, chosen === 'deny' ? 'deny' : 'allow');

    void done.then(async () => cache.invalidateQueries({ queryKey: adminQueries.key }));
  };

  return (
    <DialogCompanion label="Who may watch this" isOpen={about !== null} onClose={onClose}>
      <DialogTitle
        title={`Who may watch ${title}`}
        detail="Whatever age limit each account has. A denial always wins."
      />

      <DialogContent className="flex flex-col gap-1">
        {accounts.length === 0 ? (
          <p className="py-2 text-sm text-text-muted">
            There is nobody to decide about. Administrators see everything, and taking something out
            of your own browsing is what hiding it does.
          </p>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-wrap items-center gap-3 rounded-lg px-1 py-2"
            >
              {account.face === null ? (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-semibold text-text">
                  {(account.name.trim()[0] ?? '?').toUpperCase()}
                </span>
              ) : (
                <ProfileFace profile={account.face} className="size-9 shrink-0 rounded-full" />
              )}

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-text">{account.name}</span>
                <span className="truncate text-xs text-text-muted">{account.email}</span>
              </span>

              <SegmentedRow
                label={`Who may watch ${title}: ${account.name}`}
                size="sm"
                tone="accent"
                items={CHOICES}
                value={standing.find((one) => one.accountId === account.id)?.effect ?? 'none'}
                onSelect={(chosen) => {
                  decide(account.id, chosen);
                }}
              />
            </div>
          ))
        )}
      </DialogContent>
    </DialogCompanion>
  );
};

DecideForSomebody.displayName = 'DecideForSomebody';

export { DecideForSomebody };
