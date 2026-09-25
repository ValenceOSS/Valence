import { Icon } from '@ValenceUI/Icon';
import {
  CircleCheck as CircleCheckIcon,
  CirclePause as CirclePauseIcon,
  Clock as ClockIcon,
  Copy as CopyIcon,
  DoorOpen as DoorOpenIcon,
  Eye as EyeIcon,
  Headphones as HeadphonesIcon,
  UserPlus as UserPlusIcon,
} from '@keyline-icons/react';
import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { whereTheRoomIs } from '@ValenceCore/functions/whereTheRoomIs';
import type { PartyMember } from '@ValenceContracts/schemas/WatchParty';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { PartyPanelProps } from './PartyPanel.types';

const ROLE_LABELS = {
  host: 'screens.partyPanel.roleHost',
  coHost: 'screens.partyPanel.roleCoHost',
  guest: 'screens.partyPanel.roleGuest',
} as const satisfies Record<PartyMember['role'], StringKey>;

const WORDS = {
  watch: {
    doing: 'screens.partyPanel.watchingCount',
    isDoing: 'screens.partyPanel.watching',
    notDoing: 'screens.partyPanel.notWatching',
    invite: 'screens.partyPanel.inviteBodyWatching',
    icon: EyeIcon,
  },
  listen: {
    doing: 'screens.partyPanel.listeningCount',
    isDoing: 'screens.partyPanel.listening',
    notDoing: 'screens.partyPanel.notListening',
    invite: 'screens.partyPanel.inviteBodyListening',
    icon: HeadphonesIcon,
  },
} as const;

const WORTH_SAYING_SECONDS = 1;

/**
 * How far behind the party's reference somebody is, said in a way worth reading.
 *
 * Both positions are carried forward to the same instant before they are compared, because they were
 * measured at different moments — comparing them as they stand would report the gap between two
 * readings taken a second apart as though it were drift between two players.
 *
 * @param member - The member being described.
 * @param reference - Whoever is keeping time.
 * @returns A short phrase, or null where they are close enough for it not to be worth saying.
 */
const describeDrift = (member: PartyMember, reference: PartyMember): string | null => {
  const atMs = Math.max(member.reportedAtMs, reference.reportedAtMs);
  const behind = whereTheRoomIs(reference, atMs) - whereTheRoomIs(member, atMs);

  return Math.abs(behind) < WORTH_SAYING_SECONDS
    ? null
    : say(behind > 0 ? 'screens.partyPanel.behind' : 'screens.partyPanel.ahead', {
        seconds: Math.abs(behind).toFixed(1),
      });
};

/**
 * Who is in the party, what they are doing, and — for whoever is running it — the controls for
 * tightening it.
 *
 * Says who is actually watching rather than only who has joined, because those are different things:
 * somebody can be in the party with the film paused, or still buffering, and a list that showed them
 * identically would answer the wrong question.
 *
 * The controls are shown only to whoever may use them, but that is presentation — the server refuses
 * the message regardless, which is the part that matters.
 *
 * @param party - The party as the server last described it.
 * @param meConnectionId - Which member this tab is, so it can be marked.
 * @param waitingFor - Whoever the room is waiting for before it can play.
 * @param onSetRole - Called to change somebody's role.
 * @param onLoosen - Called to change what everybody may do.
 * @param onLeave - Called to leave.
 * @param onRemove - Called to put somebody out of the party.
 * @param onSetPassword - Called to put a password on the party, or to take it off.
 * @param people - Everybody with an account here, to be asked along.
 * @param onAsk - Called to ask one of them, which reaches them wherever they asked to be told things.
 * @param invitation - The address that puts somebody else in this party, where there is one to give.
 * @param onCopyInvitation - Called to put that address on the clipboard.
 * @returns The panel.
 */
const PartyPanel = ({
  party,
  meConnectionId,
  waitingFor = [],
  onSetRole,
  onLoosen,
  onLeave,
  onRemove,
  onSetPassword,
  people = [],
  onAsk,
  invitation,
  onCopyInvitation,
}: PartyPanelProps) => {
  const [hasCopied, setHasCopied] = useState(false);
  const [password, setPassword] = useState('');
  const [asked, setAsked] = useState<readonly string[]>([]);
  const me = party.members.find((member) => member.connectionId === meConnectionId);
  const timekeeper = party.members.find((member) => member.connectionId === party.timekeeperId);
  const watching = party.members.filter((member) => member.isWatching).length;
  const words = WORDS[party.kind];
  const mayAsk = me?.role === 'host' || me?.role === 'coHost';

  const elsewhere = people.filter(
    (person) =>
      !party.members.some(
        (member) => member.profileId === person.id || member.accountId === person.accountId,
      ),
  );

  return (
    <section className="flex w-96 max-w-[calc(100vw-3rem)] flex-col gap-2 text-text">
      <PanelCard
        title={sayCount(words.doing, watching)}
        isFlush
        actions={
          onLeave === undefined ? undefined : (
            <PanelCardAction icon={DoorOpenIcon} onClick={onLeave}>
              {say('screens.partyPanel.leave')}
            </PanelCardAction>
          )
        }
      >
        {!party.isHeld || waitingFor.length === 0 ? null : (
          <div className="border-b border-[var(--surface-line)] p-3">
            <Callout
              tone="warning"
              icon={ClockIcon}
              title={
                waitingFor.length === 1
                  ? say('screens.partyPanel.waitingForOne', { name: waitingFor[0] ?? '' })
                  : sayCount('screens.partyPanel.waitingForPeople', waitingFor.length)
              }
            />
          </div>
        )}

        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {party.members.map((member) => {
            const drift = timekeeper === undefined ? null : describeDrift(member, timekeeper);

            return (
              <li key={member.connectionId} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span className="text-sm font-medium">
                  {member.connectionId === meConnectionId
                    ? say('screens.partyPanel.nameYou', { name: member.name })
                    : member.name}
                </span>

                <Badge size="sm">{say(ROLE_LABELS[member.role])}</Badge>

                {member.connectionId === party.timekeeperId && (
                  <Badge size="sm" tone="quiet">
                    <Icon of={ClockIcon} size={12} />
                    {say('screens.partyPanel.keepingTime')}
                  </Badge>
                )}

                {member.isWatching ? (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Icon of={words.icon} size={13} />
                    {say(words.isDoing)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Icon of={CirclePauseIcon} size={13} />
                    {say(words.notDoing)}
                  </span>
                )}

                {drift !== null && <span className="text-xs text-text-muted">{drift}</span>}

                {me?.role === 'host' && member.connectionId !== meConnectionId && (
                  <span className="ml-auto flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onSetRole?.(
                          member.connectionId,
                          member.role === 'coHost' ? 'guest' : 'coHost',
                        );
                      }}
                    >
                      {member.role === 'coHost'
                        ? say('screens.partyPanel.makeGuest')
                        : say('screens.partyPanel.makeCoHost')}
                    </Button>

                    {onRemove === undefined ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        label={say('screens.partyPanel.removeWho', { name: member.name })}
                        onClick={() => {
                          onRemove(member.connectionId);
                        }}
                      >
                        {say('screens.partyPanel.remove')}
                      </Button>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </PanelCard>

      {invitation === undefined ? null : (
        <PanelCard
          title={say('screens.partyPanel.inviteTitle')}
          actions={
            <PanelCardAction
              icon={hasCopied ? CircleCheckIcon : CopyIcon}
              onClick={() => {
                void onCopyInvitation?.(invitation).then(() => {
                  setHasCopied(true);
                });
              }}
            >
              {hasCopied ? say('screens.partyPanel.copied') : say('screens.partyPanel.copy')}
            </PanelCardAction>
          }
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs leading-relaxed text-text-muted">{say(words.invite)}</p>

            <code className="min-w-0 select-all truncate rounded-md bg-[var(--surface-hover)] px-3 py-2 font-mono text-xs">
              {invitation}
            </code>
          </div>
        </PanelCard>
      )}

      {!mayAsk || onAsk === undefined || elsewhere.length === 0 ? null : (
        <PanelCard title={say('screens.partyPanel.askAlongTitle')} isFlush>
          <p className="px-4 pt-3 text-xs leading-relaxed text-text-muted">
            {say('screens.partyPanel.askAlongBody')}
          </p>

          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
            {elsewhere.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-2 px-4 py-2">
                <span className="min-w-0 truncate text-sm">{person.name}</span>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={asked.includes(person.id)}
                  label={say('screens.partyPanel.askWho', { name: person.name })}
                  onClick={() => {
                    setAsked((already) => [...already, person.id]);
                    onAsk(person.id);
                  }}
                >
                  <Icon of={UserPlusIcon} size={14} />
                  {asked.includes(person.id)
                    ? say('screens.partyPanel.asked')
                    : say('screens.partyPanel.ask')}
                </Button>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}

      {me?.role !== 'host' ? null : (
        <PanelCard title={say('screens.partyPanel.controlsTitle')}>
          <div className="flex flex-col gap-3">
            <Switch
              label={say('screens.partyPanel.everyonePlayPause')}
              isOn={party.everyoneMayPlayPause}
              onToggle={() => {
                onLoosen?.({ everyoneMayPlayPause: !party.everyoneMayPlayPause });
              }}
            />

            <Switch
              label={say('screens.partyPanel.everyoneSeek')}
              isOn={party.everyoneMaySeek}
              onToggle={() => {
                onLoosen?.({ everyoneMaySeek: !party.everyoneMaySeek });
              }}
            />

            <p className="text-xs leading-relaxed text-text-muted">
              {say('screens.partyPanel.skippingNote')}
            </p>

            {onSetPassword === undefined ? null : (
              <div className="flex flex-col gap-2 border-t border-[var(--surface-line)] pt-3">
                <p className="text-xs leading-relaxed text-text-muted">
                  {party.hasPassword
                    ? say('screens.partyPanel.hasPassword')
                    : say('screens.partyPanel.noPassword')}
                </p>

                <div className="flex items-end gap-2">
                  <TextField
                    label={say('screens.partyPanel.passwordLabel')}
                    type="password"
                    size="sm"
                    value={password}
                    placeholder={
                      party.hasPassword
                        ? say('screens.partyPanel.passwordSetNew')
                        : say('screens.partyPanel.passwordNone')
                    }
                    autoComplete="off"
                    className="min-w-0 flex-1"
                    onValueChange={setPassword}
                  />

                  <Button
                    variant="glossy"
                    size="sm"
                    disabled={password.length === 0}
                    onClick={() => {
                      onSetPassword(password);
                      setPassword('');
                    }}
                  >
                    {say('screens.partyPanel.setPassword')}
                  </Button>

                  {party.hasPassword && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onSetPassword(null);
                        setPassword('');
                      }}
                    >
                      {say('screens.partyPanel.clearPassword')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </PanelCard>
      )}
    </section>
  );
};

PartyPanel.displayName = 'PartyPanel';

export { PartyPanel };
