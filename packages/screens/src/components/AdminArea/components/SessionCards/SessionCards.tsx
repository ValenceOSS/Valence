import { Tv as EmptyTvIcon } from '@keyline-icons/react/fill';
import { NothingHere } from '@ValenceUI/NothingHere';
import { SessionCard } from '@ValenceScreens/components/AdminArea/components/SessionCard/SessionCard';
import { groupSessionsByViewer } from '@ValenceScreens/components/AdminArea/groupSessionsByViewer';
import type { SessionCardsProps } from './SessionCards.types';
import { say } from '@ValenceI18n/say';

/**
 * Every open session as a card, gathered under whoever has it open, or a note that nobody does.
 *
 * @param sessions - Every session open at the moment.
 * @param busyClientId - The session an instruction is in flight for, if any.
 * @param onStop - Called with the session to stop.
 * @param onPause - Called with the session to pause.
 * @param onResume - Called with the session to let carry on.
 * @param onMessage - Called with the session somebody wants to tell something.
 */
const SessionCards = ({
  sessions,
  busyClientId,
  onStop,
  onPause,
  onResume,
  onMessage,
}: SessionCardsProps) => (
  <div className="flex flex-col gap-4">
    {sessions.length === 0 ? (
      <NothingHere
        of={EmptyTvIcon}
        title={say('screens.adminArea.activityPanel.nobodyHasTheAppOpenRight')}
        isCompact
      />
    ) : (
      groupSessionsByViewer(sessions).map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-text-muted">{group.label}</h3>

          <div className="flex flex-col gap-2">
            {group.sessions.map((session) => (
              <SessionCard
                key={session.clientId}
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
              />
            ))}
          </div>
        </div>
      ))
    )}
  </div>
);

SessionCards.displayName = 'SessionCards';

export { SessionCards };
