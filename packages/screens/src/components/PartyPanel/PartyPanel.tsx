import { Icon } from '@ValenceUI/Icon';
import {
  Clock as ClockIcon,
  Crown as CrownIcon,
  UserPlus as UserPlusIcon,
  UserX as UserXIcon,
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
import { PanelCard } from '@ValenceUI/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { SharedTimeline } from '@ValenceUI/SharedTimeline';
import { Switch } from '@ValenceUI/Switch';
import { PartyChat } from '@ValenceScreens/components/PartyChat/PartyChat';
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
import { memberActivity } from '@ValenceClient/party/memberActivity';
import { sayActivity } from '@ValenceClient/party/sayActivity';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { cn } from '@ValenceUI/cn';
import { askableGroups } from '@ValenceClient/party/askableGroups';
import type { Askable } from '@ValenceClient/party/whoCanBeAsked';
import type { PartyMember } from '@ValenceContracts/schemas/WatchParty';
import type { PartyPanelProps } from './PartyPanel.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const ACTIVITY_DOTS = {
  doing: 'bg-success',
  paused: 'bg-text-muted',
  notDoing: 'bg-warning',
} as const;

const TICK_MS = 1000;

const HERE = 'here';

const NO_FACE = { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED } as const;

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
    return { text: say('common.inSync'), isTogether: true };
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
 * Somebody's face as their profile draws it, or their initial where there is no profile to draw it
 * from, as for somebody from a linked server.
 *
 * @param name - What they are called.
 * @param person - Their profile, where this server has one.
 * @returns The face.
 */
const faceOf = (name: string, person: Askable | undefined) => (
  <FaceCircle
    name={name}
    colour={person?.colour ?? PROFILE_COLOURS[0]}
    avatar={person?.avatar ?? NO_FACE}
    source={
      person?.updatedAt === undefined
        ? ''
        : profileAvatarUrl({
            id: person.id,
            updatedAt: person.updatedAt,
            pictureUrl: person.pictureUrl,
          })
    }
    className="size-7 text-xs"
  />
);

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
 * @param chat - What everybody in the party has said, while its chat is on.
 * @param onWrite - Called with something to say in the party's chat; without it there is no chat.
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
  chat = [],
  onWrite,
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
  const words = PARTY_WORDS[party.kind];
  const mayAsk = me?.role === 'host' || me?.role === 'coHost';
  const atMs = usePartyClock(party.members, party.isPlaying);
  const together =
    timekeeper === undefined ? null : describeTogetherness(party.members, timekeeper);

  const elsewhere = whoCanBeAsked(party, people);

  return (
    <section className="flex w-96 max-w-[calc(100vw-3rem)] flex-col gap-2 text-text">
      <PanelCard
        title={sayCount('common.partyPanel.countInTheParty', party.members.length)}
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
                  face: faceOf(
                    member.name,
                    people.find((someone) => someone.id === member.profileId),
                  ),
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
            const activity = memberActivity(member, party);
            const about = [
              ROLE_NAMES[member.role],
              member.connectionId === party.timekeeperId
                ? say('common.partyPanel.keepingTime')
                : null,
              drift,
            ]
              .filter((part) => part !== null)
              .join(' · ');

            return (
              <li key={member.connectionId} className="flex items-center gap-3 px-4 py-2.5">
                {faceOf(
                  member.name,
                  people.find((someone) => someone.id === member.profileId),
                )}

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {member.connectionId === meConnectionId
                      ? say('common.partyPanel.nameYou', { name: member.name })
                      : member.name}
                  </span>
                  <span className="truncate text-xs text-text-muted">{about}</span>
                </span>

                <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
                  <span
                    aria-hidden
                    className={cn('size-1.5 rounded-full', ACTIVITY_DOTS[activity])}
                  />
                  {sayActivity(member, party, words)}
                </span>

                {me?.role === 'host' && member.connectionId !== meConnectionId && (
                  <ActionMenu
                    label={say('common.actionsForName', { name: member.name })}
                    size="sm"
                    groups={[
                      {
                        items: [
                          {
                            id: 'role',
                            label:
                              member.role === 'coHost'
                                ? say('common.partyPanel.makeAGuest')
                                : say('common.partyPanel.makeACoHost'),
                            icon: <Icon of={CrownIcon} size={15} />,
                            onChoose: () => {
                              onSetRole?.(
                                member.connectionId,
                                member.role === 'coHost' ? 'guest' : 'coHost',
                              );
                            },
                          },
                          ...(onRemove === undefined
                            ? []
                            : [
                                {
                                  id: 'remove',
                                  label: say('common.partyPanel.removeNameFromTheParty', {
                                    name: member.name,
                                  }),
                                  icon: <Icon of={UserXIcon} size={15} />,
                                  isDestructive: true,
                                  onChoose: () => {
                                    onRemove(member.connectionId);
                                  },
                                },
                              ]),
                        ],
                      },
                    ]}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </PanelCard>

      {invitation === undefined ? null : (
        <PanelCard
          title={say('common.partyPanel.ask')}
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

          {askableGroups(elsewhere).map((group) => (
            <div key={group.server?.id ?? HERE}>
              {group.server === null ? null : (
                <p className="mt-2 border-t border-[var(--surface-line)] px-4 pt-3 pb-1 text-xs font-medium text-text-muted">
                  {say('common.partyPanel.membersFromServer', { server: group.server.name })}
                </p>
              )}

              <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
                {group.people.map((person) => (
                  <li key={person.id} className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="flex min-w-0 items-center gap-3">
                      {faceOf(person.ownName ?? person.name, person)}
                      <span className="min-w-0 truncate text-sm">
                        {person.ownName ?? person.name}
                      </span>
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={asked.includes(person.id)}
                      label={say('common.partyPanel.askNameAlong', { name: person.name })}
                      hasTooltip={false}
                      className="-me-2.5"
                      onClick={() => {
                        setAsked((already) => [...already, person.id]);
                        onAsk(person.id);
                      }}
                    >
                      {asked.includes(person.id)
                        ? say('common.partyPanel.asked')
                        : say('common.partyPanel.ask')}
                      <Icon of={UserPlusIcon} size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </PanelCard>
      )}

      {!party.chatIsOn || onWrite === undefined ? null : (
        <PartyChat lines={chat} meConnectionId={meConnectionId} onWrite={onWrite} />
      )}

      {me?.role !== 'host' ? null : (
        <PanelCard title={say('common.partyPanel.controls')} isFlush>
          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
            {[
              {
                id: 'playPause',
                label: say('common.partyPanel.everyoneCanPlayPause'),
                isOn: party.everyoneMayPlayPause,
                toggle: () => {
                  onLoosen?.({ everyoneMayPlayPause: !party.everyoneMayPlayPause });
                },
              },
              {
                id: 'scrub',
                label: say('common.partyPanel.everyoneCanScrub'),
                isOn: party.everyoneMaySeek,
                toggle: () => {
                  onLoosen?.({ everyoneMaySeek: !party.everyoneMaySeek });
                },
              },
              ...(onWrite === undefined
                ? []
                : [
                    {
                      id: 'chat',
                      label: say('common.partyChat.everyoneCanChat'),
                      isOn: party.chatIsOn,
                      toggle: () => {
                        onLoosen?.({ chatIsOn: !party.chatIsOn });
                      },
                    },
                  ]),
            ].map((control) => (
              <li
                key={control.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span>{control.label}</span>
                <Switch
                  label={control.label}
                  isLabelHidden
                  isOn={control.isOn}
                  onToggle={control.toggle}
                />
              </li>
            ))}

            {onSetPassword === undefined ? null : (
              <li className="flex flex-col gap-2 px-4 py-3">
                <span className="flex flex-col">
                  <span className="text-sm">{say('common.password')}</span>
                  <span className="text-xs text-text-muted">
                    {party.hasPassword
                      ? say('common.partyPanel.thisPartyHasAPasswordAnybody')
                      : say('common.partyPanel.aPasswordAsksAnybodyOpeningThe')}
                  </span>
                </span>

                <span className="flex items-center gap-2">
                  <TextField
                    label={say('common.password')}
                    isLabelHidden
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
                </span>
              </li>
            )}
          </ul>
        </PanelCard>
      )}
    </section>
  );
};

PartyPanel.displayName = 'PartyPanel';

export { PartyPanel };
