import { Spinner } from '@ValenceUI/Spinner';
import { nameOfSession } from '@ValenceScreens/admin/nameOfSession';
import { useState } from 'react';
import { SessionCards } from '@ValenceScreens/components/AdminArea/components/SessionCards/SessionCards';
import { SessionMessageDialog } from '@ValenceScreens/components/AdminArea/components/SessionMessageDialog/SessionMessageDialog';
import {
  readSessionLayout,
  saveSessionLayout,
} from '@ValenceScreens/components/AdminArea/sessionLayoutPreference';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SessionTable } from '@ValenceScreens/components/AdminArea/components/SessionTable/SessionTable';
import { Grid2x2 as CardsIcon, Table as TableIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import type { ActivityPanelProps } from './ActivityPanel.types';
import { say } from '@ValenceI18n/say';

const LAYOUTS = [
  { id: 'table', label: say('screens.adminArea.activityPanel.showAsATable'), glyph: TableIcon },
  { id: 'cards', label: say('screens.adminArea.activityPanel.showAsCards'), glyph: CardsIcon },
] as const;

/**
 * Who has the app open, what they are watching, and how well it is going for them — grouped by viewer
 * rather than listed flat, since one person with several tabs open is one person. Carries the
 * controls for intervening: stopping a session outright, or pausing it with a reason the viewer will
 * be shown. Shown as a table unless the cards are asked for.
 *
 * @param sessions - Every session open at the moment.
 * @param isReading - Whether they are still being read for the first time.
 * @param busyClientId - The session an instruction is in flight for, if any.
 * @param onStop - Called with the session to stop.
 * @param onPause - Called with the session to pause.
 * @param onResume - Called with the session to let carry on.
 * @param onMessage - Called with the session to tell something, and what to tell it.
 * @returns The panel.
 */
const ActivityPanel = ({
  sessions,
  isReading = false,
  busyClientId,
  onStop,
  onPause,
  onResume,
  onMessage,
}: ActivityPanelProps) => {
  const [messaging, setMessaging] = useState<string | null>(null);
  const [layout, setLayout] = useState(readSessionLayout);
  const [lastMessaged, setLastMessaged] = useState('');

  const watcher = sessions.find((session) => session.clientId === messaging);

  return (
    <PanelCard
      title={say('common.sessions')}
      isFlush={layout === 'table'}
      actions={
        <div
          role="group"
          aria-label={say('screens.adminArea.activityPanel.showSessionsAs')}
          className={JOINED_LOOKS.track}
        >
          {LAYOUTS.map((one) => (
            <Button
              key={one.id}
              variant="bare"
              size="none"
              label={one.label}
              aria-pressed={layout === one.id}
              className={cn(
                JOINED_LOOKS.segment,
                'inline-flex items-center px-2.5',
                layout === one.id ? 'bg-[var(--surface-active)]' : 'text-text-muted',
              )}
              onClick={() => {
                setLayout(one.id);
                saveSessionLayout(one.id);
              }}
            >
              <Icon of={one.glyph} size={15} />
            </Button>
          ))}
        </div>
      }
    >
      {isReading ? (
        <Spinner isCentered size="sm" label={say('common.loading')} />
      ) : layout === 'table' ? (
        <SessionTable
          sessions={sessions}
          busyClientId={busyClientId}
          onStop={onStop}
          onPause={onPause}
          onResume={onResume}
          onMessage={(session) => {
            setMessaging(session.clientId);
            setLastMessaged(nameOfSession(session));
          }}
        />
      ) : (
        <SessionCards
          sessions={sessions}
          busyClientId={busyClientId}
          onStop={onStop}
          onPause={onPause}
          onResume={onResume}
          onMessage={(session) => {
            setMessaging(session.clientId);
            setLastMessaged(nameOfSession(session));
          }}
        />
      )}
      <SessionMessageDialog
        watcher={watcher === undefined ? lastMessaged : nameOfSession(watcher)}
        isOpen={watcher !== undefined}
        onSend={async (text) => {
          if (watcher !== undefined) {
            await onMessage(watcher.clientId, text);
          }
        }}
        onClose={() => {
          setMessaging(null);
        }}
      />
    </PanelCard>
  );
};

ActivityPanel.displayName = 'ActivityPanel';

export { ActivityPanel };
