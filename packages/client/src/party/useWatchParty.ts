import { useCallback, useEffect, useRef, useState } from 'react';
import { createPartyClient } from './createPartyClient';
import { whereTheRoomIs } from '@ValenceCore/functions/whereTheRoomIs';
import { whoIsHoldingUp } from '@ValenceCore/functions/whoIsHoldingUp';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import type { PartyClient } from './createPartyClient';
import type {
  PartyKind,
  PartyRole,
  SequencedCommand,
  WatchParty,
} from '@ValenceContracts/schemas/WatchParty';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';
import { say } from '@ValenceI18n/say';

const ASK_THE_CLOCK_EVERY_MS = 5000;

type PasswordWanted = {
  partyId: string;
  wasWrong: boolean;
};

type WatchPartyState = {
  party: WatchParty | null;
  command: SequencedCommand | null;
  refusal: string | null;
  notice: string | null;
  passwordWanted: PasswordWanted | null;
  meConnectionId: string | null;
  referenceSeconds: number | null;
  waitingFor: readonly string[];
  jitterMs: number;
  open: (mediaId: string, kind?: PartyKind) => void;
  join: (partyId: string, password?: string) => void;
  leave: () => void;
  send: PartyClient['send'];
  report: PartyClient['report'];
  setRole: (connectionId: string, role: PartyRole) => void;
  remove: (connectionId: string) => void;
  ask: (profileId: string) => void;
  setPassword: (password: string | null) => void;
  forgetNotice: () => void;
  stopAsking: () => void;
  loosen: (how: { everyoneMaySeek?: boolean; everyoneMayPlayPause?: boolean }) => void;
};

type RoomClock = {
  referenceSeconds: number | null;
  waitingFor: readonly string[];
  jitterMs: number;
};

const NOTHING_HEARD: RoomClock = { referenceSeconds: null, waitingFor: [], jitterMs: 0 };

/**
 * Where the room is, read at the moment the room spoke.
 *
 * The clock is read here rather than while rendering, and it is read when a message arrives rather
 * than a render later: somebody joining a party decides where to start from the first answer they
 * get, and an answer that arrives one render after they have already started is an answer that
 * starts them in the wrong place.
 *
 * @param party - The party as the server last described it.
 * @param command - The last command, which a timekeeper older than it cannot yet speak for.
 * @param meConnectionId - This tab's connection, which is never followed.
 * @param held - The party client, for the offset between this clock and the room's.
 * @returns What to report about the room.
 */
const readRoom = (
  party: WatchParty | null,
  command: SequencedCommand | null,
  meConnectionId: string | null,
  held: PartyClient | null,
): RoomClock => {
  const roomMs = Date.now() + (held?.offsetMs() ?? 0);
  const timekeeper = party?.members.find((member) => member.connectionId === party.timekeeperId);
  const isWorthFollowing =
    timekeeper !== undefined &&
    timekeeper.connectionId !== meConnectionId &&
    timekeeper.isReady &&
    (command === null || timekeeper.reportedAtMs >= command.atMs);

  return {
    referenceSeconds: isWorthFollowing ? whereTheRoomIs(timekeeper, roomMs) : null,
    waitingFor:
      party === null
        ? []
        : whoIsHoldingUp(party.members, party.timekeeperId, roomMs, command?.atMs ?? null).map(
            (member) => member.name,
          ),
    jitterMs: held?.jitterMs() ?? 0,
  };
};

/**
 * Holds this tab's watch party, if it is in one.
 *
 * The party is whatever the server last said it is, never what this tab believes it should be —
 * a client that applied its own commands optimistically would drift out of agreement with everybody
 * else the moment one was refused.
 *
 * @param client - The shared socket, injectable for tests.
 * @returns The party and the ways of acting on it.
 */
const useWatchParty = (client: RealtimeClient = getRealtimeClient()): WatchPartyState => {
  const [party, setParty] = useState<WatchParty | null>(null);
  const [command, setCommand] = useState<SequencedCommand | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [passwordWanted, setPasswordWanted] = useState<PasswordWanted | null>(null);
  const [room, setRoom] = useState<RoomClock>(NOTHING_HEARD);
  const partyRef = useRef<PartyClient | null>(null);
  const inPartyRef = useRef<string | null>(null);
  const waitingToJoinRef = useRef<{ partyId: string; password?: string } | null>(null);
  const toldRef = useRef<{ party: WatchParty | null; command: SequencedCommand | null }>({
    party: null,
    command: null,
  });

  useEffect(() => {
    const held = createPartyClient({
      client,
      watcher: {
        onParty: (told) => {
          const now = told.members.length === 0 ? null : told;

          toldRef.current = { ...toldRef.current, party: now };
          setParty(now);
          setRoom(readRoom(now, toldRef.current.command, client.connectionId(), held));
        },
        onCommand: (told) => {
          toldRef.current = { ...toldRef.current, command: told };
          setCommand(told);
          setRoom(readRoom(toldRef.current.party, told, client.connectionId(), held));
        },
        onNotice: (told) => {
          setNotice(say('client.useWatchParty.removed', { name: told.byName }));
        },
      },
      schedule: (run, afterMs) => {
        const timer = setTimeout(run, afterMs);

        return () => {
          clearTimeout(timer);
        };
      },
      everyMs: ASK_THE_CLOCK_EVERY_MS,
      now: () => Date.now(),
    });

    partyRef.current = held;

    const waiting = waitingToJoinRef.current;

    if (waiting !== null) {
      waitingToJoinRef.current = null;
      held.join(waiting.partyId, waiting.password);
    }

    const stopRefusals = client.onRefused(setRefusal);

    const stopChallenges = client.onNeedsPassword((partyId, wasWrong) => {
      setPasswordWanted({ partyId, wasWrong });
    });

    return () => {
      held.stop();
      stopRefusals();
      stopChallenges();
      partyRef.current = null;
    };
  }, [client]);

  const hasParty = party !== null;

  useEffect(() => {
    if (!hasParty) {
      return;
    }

    return partyRef.current?.watchClock();
  }, [hasParty]);

  useEffect(() => {
    inPartyRef.current = party?.id ?? null;
  }, [party]);

  useEffect(
    () =>
      client.onResumed(() => {
        const rejoining = inPartyRef.current;

        if (rejoining !== null) {
          partyRef.current?.join(rejoining);
        }
      }),
    [client],
  );

  const meConnectionId = client.connectionId();

  const open = useCallback((mediaId: string, kind?: PartyKind) => {
    partyRef.current?.open(mediaId, kind);
  }, []);

  const join = useCallback((partyId: string, password?: string) => {
    setPasswordWanted(null);

    if (partyRef.current === null) {
      waitingToJoinRef.current = { partyId, ...(password === undefined ? {} : { password }) };

      return;
    }

    partyRef.current.join(partyId, password);
  }, []);

  const leave = useCallback(() => {
    inPartyRef.current = null;
    partyRef.current?.leave();
    setParty(null);
    setCommand(null);
  }, []);

  const send = useCallback<PartyClient['send']>((next) => {
    partyRef.current?.send(next);
  }, []);

  const report = useCallback<PartyClient['report']>((where) => {
    partyRef.current?.report(where);
  }, []);

  const setRole = useCallback((connectionId: string, role: PartyRole) => {
    partyRef.current?.setRole(connectionId, role);
  }, []);

  const remove = useCallback((connectionId: string) => {
    partyRef.current?.remove(connectionId);
  }, []);

  const ask = useCallback((profileId: string) => {
    partyRef.current?.ask(profileId);
  }, []);

  const setPassword = useCallback((password: string | null) => {
    partyRef.current?.setPassword(password);
  }, []);

  const forgetNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const stopAsking = useCallback(() => {
    setPasswordWanted(null);
  }, []);

  const loosen = useCallback(
    (how: { everyoneMaySeek?: boolean; everyoneMayPlayPause?: boolean }) => {
      partyRef.current?.loosen(how);
    },
    [],
  );

  return {
    party,
    command,
    refusal,
    notice,
    passwordWanted,
    meConnectionId,
    referenceSeconds: room.referenceSeconds,
    waitingFor: room.waitingFor,
    jitterMs: room.jitterMs,
    open,
    join,
    leave,
    send,
    report,
    setRole,
    remove,
    ask,
    setPassword,
    forgetNotice,
    stopAsking,
    loosen,
  };
};

export type { WatchPartyState };

export { useWatchParty };
