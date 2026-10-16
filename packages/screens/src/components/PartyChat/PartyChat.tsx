import { useEffect, useRef, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import { PARTY_CHAT_LIMIT } from '@ValenceContracts/schemas/WatchParty';
import { PanelCard } from '@ValenceUI/PanelCard';
import type { PartyChatProps } from './PartyChat.types';
import { say } from '@ValenceI18n/say';

/**
 * What everybody in a watch party has said, newest at the foot, and somewhere to say something. The
 * list keeps to its newest line as lines arrive, so the conversation is where the eye already is.
 *
 * @param lines - What has been said, in order.
 * @param meConnectionId - This tab, whose own lines are marked as theirs.
 * @param onWrite - Told what was written, to pass on to the party.
 */
const PartyChat = ({ lines, meConnectionId, onWrite }: PartyChatProps) => {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const isEmpty = draft.trim() === '';

  useEffect(() => {
    const list = listRef.current;

    if (list !== null) {
      list.scrollTop = list.scrollHeight;
    }
  }, [lines.length]);

  return (
    <PanelCard title={say('common.partyChat.chat')}>
      <div className="flex flex-col gap-3">
        {lines.length === 0 ? (
          <p className="text-xs text-text-muted">{say('common.partyChat.nothingSaidYet')}</p>
        ) : (
          <ol
            ref={listRef}
            aria-live="polite"
            className="flex max-h-56 flex-col gap-1.5 overflow-y-auto"
          >
            {lines.map((line) => (
              <li key={line.id} className="text-sm leading-snug break-words">
                <span
                  className={cn(
                    'mr-1.5 font-semibold',
                    line.byConnectionId === meConnectionId ? 'text-text-muted' : 'text-text',
                  )}
                >
                  {line.byConnectionId === meConnectionId
                    ? say('screens.ratingPanel.you')
                    : line.byName}
                </span>
                <span className="text-text">{line.text}</span>
              </li>
            ))}
          </ol>
        )}

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();

            if (!isEmpty) {
              onWrite(draft.trim().slice(0, PARTY_CHAT_LIMIT));
              setDraft('');
            }
          }}
        >
          <TextField
            label={say('common.partyChat.saySomething')}
            isLabelHidden
            placeholder={say('common.partyChat.saySomething')}
            size="sm"
            value={draft}
            autoComplete="off"
            className="min-w-0 flex-1"
            onValueChange={setDraft}
          />

          <Button type="submit" variant="glossy" size="sm" disabled={isEmpty}>
            {say('screens.adminArea.sessionMessageDialog.send')}
          </Button>
        </form>
      </div>
    </PanelCard>
  );
};

PartyChat.displayName = 'PartyChat';

export { PartyChat };
