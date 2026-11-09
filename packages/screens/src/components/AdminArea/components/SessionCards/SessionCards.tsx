import { useQuery } from '@tanstack/react-query';
import { Tv as EmptyTvIcon, User as UserIcon } from '@keyline-icons/react/fill';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Icon } from '@ValenceUI/Icon';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import { SessionCard } from '@ValenceScreens/components/AdminArea/components/SessionCard/SessionCard';
import { SessionLane } from '@ValenceScreens/components/AdminArea/components/SessionCards/components/SessionLane/SessionLane';
import { groupSessionsByViewer } from '@ValenceScreens/components/AdminArea/groupSessionsByViewer';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';
import type { SessionCardsProps } from './SessionCards.types';
import { say } from '@ValenceI18n/say';

const CARD_WIDTHS: Readonly<Record<MediaGridSize, string>> = {
  small: '15rem',
  medium: '21.25rem',
  large: '29.375rem',
};

/**
 * Every open session as a card, each person's on a panel of their own under their face and name, or
 * a note that nobody has the app open. Each person's cards run along one row that scrolls sideways
 * rather than wrapping, at the width asked for, so a size chosen is the size drawn.
 *
 * @param sessions - Every session open at the moment.
 * @param size - How large the cards are.
 * @param busyClientId - The session an instruction is in flight for, if any.
 * @param onStop - Called with the session to stop.
 * @param onPause - Called with the session to pause.
 * @param onResume - Called with the session to let carry on.
 * @param onMessage - Called with the session somebody wants to tell something.
 * @param onSignOut - Called with the session whose device to sign out, where that is allowed.
 */
const SessionCards = ({
  sessions,
  size = 'medium',
  busyClientId,
  onStop,
  onPause,
  onResume,
  onMessage,
  onSignOut,
}: SessionCardsProps) => {
  const known = useQuery(adminQueries.accounts());
  const accounts = new Map((known.data ?? []).map((account) => [account.id, account]));

  if (sessions.length === 0) {
    return (
      <div className="valence-card-face p-4">
        <NothingHere
          of={EmptyTvIcon}
          title={say('screens.adminArea.activityPanel.nobodyHasTheAppOpenRight')}
          isCompact
        />
      </div>
    );
  }

  return groupSessionsByViewer(sessions).map((group) => {
    const [first] = group.sessions;
    const account =
      first === undefined || first.isGuest ? undefined : accounts.get(first.accountId ?? '');

    return (
      <SessionLane
        key={group.key}
        name={group.label}
        count={group.sessions.length}
        size={size}
        face={
          account === undefined ? (
            <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-hover)] text-text-muted">
              <Icon of={UserIcon} size={15} />
            </span>
          ) : (
            <AccountFace account={account} className="size-6.5 text-xs" />
          )
        }
      >
        {group.sessions.map((session) => (
          <div
            key={session.clientId}
            className="grid shrink-0"
            style={{ width: `min(${CARD_WIDTHS[size]}, 100%)` }}
          >
            <SessionCard
              session={session}
              isBusy={busyClientId === session.clientId}
              onStop={() => {
                onStop(session.clientId);
              }}
              onPause={() => {
                onPause(session.clientId);
              }}
              onResume={() => {
                onResume(session.clientId);
              }}
              onMessage={() => {
                onMessage(session);
              }}
              {...(onSignOut === undefined || session.clientId === platformInUse().thisClientId()
                ? {}
                : {
                    onSignOut: () => {
                      onSignOut(session);
                    },
                  })}
            />
          </div>
        ))}
      </SessionLane>
    );
  });
};

SessionCards.displayName = 'SessionCards';

export { SessionCards };
