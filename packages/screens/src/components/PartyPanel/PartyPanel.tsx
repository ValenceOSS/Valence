import { Icon } from '@ValenceUI/Icon';
import {
  CirclePause as CirclePauseIcon,
  Clock as ClockIcon,
  Eye as EyeIcon,
  Headphones as HeadphonesIcon,
  UserPlus as UserPlusIcon,
} from '@keyline-icons/react';
import {
  CircleCheck as CircleCheckFilledIcon,
  Copy as CopyFilledIcon,
  DoorOpen as DoorOpenFilledIcon,
} from '@keyline-icons/react/fill';
import { useEffect, useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { SharedTimeline } from '@ValenceUI/SharedTimeline';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { whereTheRoomIs } from '@ValenceCore/functions/whereTheRoomIs';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { TOGETHER_WITHIN_SECONDS } from '@ValenceCore/functions/whoIsHoldingUp';
import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import { PROFILE_COLOURS, profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import { describeDrift } from '@ValenceClient/party/describeDrift';
import { ROLE_NAMES } from '@ValenceClient/party/ROLE_NAMES';
import { PARTY_WORDS } from '@ValenceClient/party/PARTY_WORDS';
import { secondsBehind } from '@ValenceClient/party/secondsBehind';
import { whoCanBeAsked } from '@ValenceClient/party/whoCanBeAsked';
import type { Askable } from '@ValenceClient/party/whoCanBeAsked';
import type { PartyMember } from '@ValenceContracts/schemas/WatchParty';
import type { PartyPanelProps } from './PartyPanel.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const ICONS = { watch: EyeIcon, listen: HeadphonesIcon } as const;

const TICK_MS = 1000;

const NO_FACE = { kind: 'initial', font: 'gilroy' } as const;

/**
 * Whether the party is together, and if not who is out of step: the badge over its timeline.
 *
 * Out of step means further from whoever keeps time than the room tolerates before it waits for
 * them, so the badge and the room's own judgement agree. Only somebody actually watching counts.
 *
 * @param members - Everybody in the party.
 * @param reference - Whoever is keeping time.
 * @returns What the badge says, and whether it is a warning.
 */
const describeTogetherness = (
  members: readonly PartyMember[],
  reference: PartyMember,
): { text: string; isTogether: boolean } => {
  const apart = members.filter(
    (member) =>
      member.isWatching && Math.abs(secondsBehind(member, reference)) >= TOGETHER_WITHIN_SECONDS,
  );
  const [only] = apart;

  if (only === undefined) {
    return { text: say('screens.partyPanel.inSync'), isTogether: true };
  }

  if (apart.length > 1) {
    return {
      text: sayCount('screens.partyPanel.countOutOfStep', apart.length),
      isTogether: false,
    };
  }

  const behind = secondsBehind(only, reference);
  const seconds = Math.abs(behind).toFixed(1);

  return {
    text:
      behind > 0
        ? say('screens.partyPanel.nameIsSecondsBehind', { name: only.name, seconds })
        : say('screens.partyPanel.nameIsSecondsAhead', { name: only.name, seconds }),
    isTogether: false,
  };
};

/**
 * Somebody's face as their profile draws it, or their initial where the party knows of no profile.
 *
 * @param member - Whose face.
 * @param people - Everybody with an account here, which is where a face is read from.
 * @returns The face.
 */
const faceOf = (member: PartyMember, people: readonly Askable[]) => {
  const person = people.find((someone) => someone.id === member.profileId);

  return (
    <FaceCircle
      name={member.name}
      colour={person?.colour ?? PROFILE_COLOURS[0]}
      avatar={person?.avatar ?? NO_FACE}
      source={
        person?.updatedAt === undefined
          ? ''
          : profileAvatarUrl({ id: person.id, updatedAt: person.updatedAt })
      }
      className="size-7 text-xs"
    />
  );
};

/**
 * The instant to carry the party's reports forward to, moving on a second at a time while the
 * party plays.
 *
 * Measured from the newest report rather than from this machine's clock, because the reports are
 * stamped by the server's and the two need not agree; what has passed here since is added on.
 *
 * @param members - Everybody in the party, whose reports are the starting point.
 * @param isPlaying - Whether time is passing in the party at all.
 * @returns The instant, on the clock the reports were stamped with.
 */
const usePartyClock = (members: readonly PartyMember[], isPlaying: boolean): number => {
  const newest = Math.max(0, ...members.map((member) => member.reportedAtMs));
  const [now, setNow] = useState(() => Date.now());
  const [since, setSince] = useState(() => ({ newest, atMs: now }));

  useEffect(() => {
    const atMs = Date.now();

    setSince({ newest, atMs });
    setNow(atMs);
  }, [newest]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const ticking = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);

    return () => {
      clearInterval(ticking);
    };
  }, [isPlaying]);

  return since.newest === newest ? newest + Math.max(0, now - since.atMs) : newest;
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
 * @param durationSeconds - How long the title is, which the timeline is drawn against; without it
 *   there is no timeline.
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
  durationSeconds,
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
  const words = PARTY_WORDS[party.kind];
  const mayAsk = me?.role === 'host' || me?.role === 'coHost';
  const atMs = usePartyClock(party.members, party.isPlaying);
  const together =
    timekeeper === undefined ? null : describeTogetherness(party.members, timekeeper);

  const elsewhere = whoCanBeAsked(party, people);

  return (
    <section className="flex w-96 max-w-[calc(100vw-3rem)] flex-col gap-2 text-text">
      <PanelCard
        title={sayCount(words.doing, watching)}
        isFlush
        actions={
          onLeave === undefined ? undefined : (
            <PanelCardAction icon={DoorOpenFilledIcon} onClick={onLeave}>
              {say('common.partyPanel.leave')}
            </PanelCardAction>
          )
        }
      >
        {timekeeper === undefined ||
        durationSeconds === undefined ||
        durationSeconds <= 0 ? null : (
          <div className="border-b border-[var(--surface-line)] px-4 pb-3 pt-6">
            <SharedTimeline
              label={say('screens.partyPanel.whereEverybodyIs')}
              durationSeconds={durationSeconds}
              inSyncSeconds={TOGETHER_WITHIN_SECONDS}
              filledSeconds={whereTheRoomIs(timekeeper, atMs)}
              elapsed={formatDuration(Math.min(whereTheRoomIs(timekeeper, atMs), durationSeconds))}
              total={formatDuration(durationSeconds)}
              {...(together === null
                ? {}
                : {
                    status: (
                      <Badge size="sm" tone={together.isTogether ? 'success' : 'warning'}>
                        {together.text}
                      </Badge>
                    ),
                  })}
              people={party.members.map((member) => {
                const position = formatDuration(
                  Math.min(whereTheRoomIs(member, atMs), durationSeconds),
                );
                const drift = describeDrift(member, timekeeper);

                return {
                  id: member.connectionId,
                  atSeconds: whereTheRoomIs(member, atMs),
                  face: faceOf(member, people),
                  label:
                    drift === null
                      ? say('screens.partyPanel.nameAtPosition', { name: member.name, position })
                      : say('screens.partyPanel.nameAtPositionDrift', {
                          name: member.name,
                          position,
                          drift,
                        }),
                };
              })}
            />
          </div>
        )}
        {!party.isHeld || waitingFor.length === 0 ? null : (
          <div className="border-b border-[var(--surface-line)] p-3">
            <Callout
              tone="warning"
              icon={ClockIcon}
              title={
                waitingFor.length === 1
                  ? say('common.partyPanel.waitingForNameToCatchUp', {
                      name: waitingFor[0] ?? '',
                    })
                  : sayCount('common.partyPanel.waitingForPeopleToCatchUp', waitingFor.length)
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
                    ? say('common.partyPanel.nameYou', { name: member.name })
                    : member.name}
                </span>

                <Badge size="sm">{ROLE_NAMES[member.role]}</Badge>

                {member.connectionId === party.timekeeperId && (
                  <Badge size="sm" tone="quiet">
                    <Icon of={ClockIcon} size={12} />
                    {say('common.partyPanel.keepingTime')}
                  </Badge>
                )}

                {member.isWatching ? (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Icon of={ICONS[party.kind]} size={13} />
                    {words.isDoing}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Icon of={CirclePauseIcon} size={13} />
                    {words.notDoing}
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
                        ? say('common.partyPanel.makeAGuest')
                        : say('common.partyPanel.makeACoHost')}
                    </Button>

                    {onRemove === undefined ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        label={say('common.partyPanel.removeNameFromTheParty', {
                          name: member.name,
                        })}
                        onClick={() => {
                          onRemove(member.connectionId);
                        }}
                      >
                        {say('common.remove')}
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
          title={say('common.partyPanel.invite')}
          actions={
            <PanelCardAction
              icon={hasCopied ? CircleCheckFilledIcon : CopyFilledIcon}
              onClick={() => {
                void onCopyInvitation?.(invitation).then(() => {
                  setHasCopied(true);
                });
              }}
            >
              {hasCopied ? say('common.copied') : say('common.copy')}
            </PanelCardAction>
          }
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs leading-relaxed text-text-muted">{words.invitation}</p>

            <code className="min-w-0 select-all truncate rounded-md bg-[var(--surface-hover)] px-3 py-2 font-mono text-xs">
              {invitation}
            </code>
          </div>
        </PanelCard>
      )}

      {!mayAsk || onAsk === undefined || elsewhere.length === 0 ? null : (
        <PanelCard title={say('common.partyPanel.askAlong')} isFlush>
          <p className="px-4 pt-3 text-xs leading-relaxed text-text-muted">
            {say('common.partyPanel.askSomebodyAlongTheyAreTold')}
          </p>

          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
            {elsewhere.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-2 px-4 py-2">
                <span className="min-w-0 truncate text-sm">{person.name}</span>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={asked.includes(person.id)}
                  label={say('common.partyPanel.askNameAlong', { name: person.name })}
                  onClick={() => {
                    setAsked((already) => [...already, person.id]);
                    onAsk(person.id);
                  }}
                >
                  <Icon of={UserPlusIcon} size={14} />
                  {asked.includes(person.id)
                    ? say('common.partyPanel.asked')
                    : say('common.partyPanel.ask')}
                </Button>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}

      {me?.role !== 'host' ? null : (
        <PanelCard title={say('common.partyPanel.controls')}>
          <div className="flex flex-col gap-3">
            <Switch
              label={say('common.partyPanel.everyoneCanPlayAndPause')}
              isOn={party.everyoneMayPlayPause}
              onToggle={() => {
                onLoosen?.({ everyoneMayPlayPause: !party.everyoneMayPlayPause });
              }}
            />

            <Switch
              label={say('common.partyPanel.everyoneCanSkipAround')}
              isOn={party.everyoneMaySeek}
              onToggle={() => {
                onLoosen?.({ everyoneMaySeek: !party.everyoneMaySeek });
              }}
            />

            <p className="text-xs leading-relaxed text-text-muted">
              {say('common.partyPanel.skippingIsTheDisruptiveOneA')}
            </p>

            {onSetPassword === undefined ? null : (
              <div className="flex flex-col gap-2 border-t border-[var(--surface-line)] pt-3">
                <p className="text-xs leading-relaxed text-text-muted">
                  {party.hasPassword
                    ? say('common.partyPanel.thisPartyHasAPasswordAnybody')
                    : say('common.partyPanel.aPasswordAsksAnybodyOpeningThe')}
                </p>

                <div className="flex items-end gap-2">
                  <TextField
                    label={say('common.partyPanel.partyPassword')}
                    type="password"
                    size="sm"
                    value={password}
                    placeholder={
                      party.hasPassword
                        ? say('common.partyPanel.setANewOne')
                        : say('common.partyPanel.noPassword')
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
                    {say('common.partyPanel.set')}
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
                      {say('common.clear')}
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
