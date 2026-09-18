import { useEffect, useMemo, useRef } from 'react';
import { fetchTracks } from '@ValenceClient/music/fetchMusic';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { listeningPartyFrom } from './listeningPartyFrom';
import { readListeningParty, setListeningParty } from './listeningParty';
import { theMusicPlayer } from './theMusicPlayer';
import { useMusicPlayer } from './useMusicPlayer';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { MusicPlayer } from './createMusicPlayer';

const REPORT_EVERY_MS = 2000;

const DRIFT_SECONDS = 2;

const JUMP_SECONDS = 2.5;

/**
 * Keeps this window's music in step with the listening party it is in.
 *
 * Whoever may choose what plays — the host, and anybody they made a co-host — is simply listened
 * to: the song they move on to, their pausing and their skipping about are sent to the party as
 * they happen, whether they pressed something or the album just carried on. Everybody else follows:
 * they load the party's song, start and stop with it, and are moved to where the host is whenever
 * they drift more than a moment from it. Volume never travels, so each listener keeps their own.
 *
 * Everybody says where they have got to every couple of seconds, which is what the party measures
 * drift by and what shows the host who is actually listening.
 *
 * An address carrying a party joins it, so an invitation opened into the music section lands in the
 * party rather than beside it.
 *
 * @param watchParty - The party this window is in, whatever kind, and how to act on it.
 * @param player - The player to keep in step, which is the window's own unless a test says otherwise.
 * @param now - The clock, for telling a skip from time passing.
 */
const useListenAlong = (
  watchParty: WatchPartyState,
  player: MusicPlayer = theMusicPlayer(),
  now: () => number = Date.now,
): void => {
  const { place } = usePlace();
  const { state } = useMusicPlayer(player);
  const { party, meConnectionId, send, join, report, command, referenceSeconds } = watchParty;

  const listening = useMemo(
    () => listeningPartyFrom({ party, meConnectionId, send }),
    [party, meConnectionId, send],
  );

  const joined = listening?.party ?? null;
  const isChoosing = listening?.mayChoose === true;
  const partyId = joined?.id ?? null;
  const partySong = joined?.mediaId ?? null;
  const isPartyPlaying = joined?.isPlaying ?? false;
  const current = state.current?.id ?? null;

  const joinedRef = useRef<string | null>(null);
  const loadingRef = useRef<string | null>(null);
  const appliedRef = useRef(-1);
  const heardRef = useRef<{ positionSeconds: number; atMs: number; trackId: string | null } | null>(
    null,
  );
  const settlingRef = useRef(false);
  const referenceRef = useRef(referenceSeconds);

  useEffect(() => {
    referenceRef.current = referenceSeconds;
  }, [referenceSeconds]);

  useEffect(() => {
    setListeningParty(listening);
  }, [listening]);

  useEffect(
    () => () => {
      setListeningParty(null);
    },
    [],
  );

  useEffect(() => {
    const wanted = place.party;

    if (wanted === null || place.playing !== null || partyId === wanted) {
      return;
    }

    if (joinedRef.current === wanted) {
      return;
    }

    joinedRef.current = wanted;
    join(wanted);
  }, [place.party, place.playing, partyId, join]);

  useEffect(() => {
    if (command === null || partySong === null || command.sequence <= appliedRef.current) {
      return;
    }

    appliedRef.current = command.sequence;

    const told = command.command;

    if (told.kind === 'changeWhatIsPlaying') {
      return;
    }

    if (command.byConnectionId === meConnectionId && isChoosing) {
      return;
    }

    if (player.read().current?.id !== partySong) {
      return;
    }

    settlingRef.current = true;
    player.seek(told.atSeconds);

    if (told.kind === 'play') {
      player.resume();
    }

    if (told.kind === 'pause') {
      player.pause();
    }
  }, [command, partySong, meConnectionId, isChoosing, player]);

  useEffect(() => {
    if (!isChoosing || partySong === null || current === null || current === partySong) {
      return;
    }

    send({ kind: 'changeWhatIsPlaying', mediaId: current });
  }, [isChoosing, partySong, current, send]);

  useEffect(() => {
    if (!isChoosing || partySong === null) {
      return;
    }

    const heard = player.read();

    if (heard.current?.id !== partySong || heard.isPlaying === isPartyPlaying) {
      return;
    }

    send({ kind: heard.isPlaying ? 'play' : 'pause', atSeconds: heard.positionSeconds });
  }, [isChoosing, partySong, isPartyPlaying, state.isPlaying, player, send]);

  useEffect(() => {
    if (!isChoosing || partyId === null) {
      heardRef.current = null;

      return;
    }

    const heard = heardRef.current;
    const atMs = now();

    heardRef.current = { positionSeconds: state.positionSeconds, atMs, trackId: current };

    if (heard === null || heard.trackId !== current || state.isLoading) {
      return;
    }

    const expected = heard.positionSeconds + (state.isPlaying ? (atMs - heard.atMs) / 1000 : 0);

    if (Math.abs(state.positionSeconds - expected) <= JUMP_SECONDS) {
      return;
    }

    if (settlingRef.current) {
      settlingRef.current = false;

      return;
    }

    send({ kind: 'seek', atSeconds: state.positionSeconds });
  }, [
    state.positionSeconds,
    state.isPlaying,
    state.isLoading,
    current,
    isChoosing,
    partyId,
    now,
    send,
  ]);

  useEffect(() => {
    if (isChoosing || partySong === null) {
      return;
    }

    if (player.read().current?.id === partySong || loadingRef.current === partySong) {
      return;
    }

    loadingRef.current = partySong;

    void fetchTracks([partySong]).then((tracks) => {
      if (loadingRef.current !== partySong) {
        return;
      }

      loadingRef.current = null;

      if (tracks.length === 0) {
        return;
      }

      player.play(tracks, 0, {
        isOrdered: true,
        positionSeconds: referenceRef.current ?? 0,
        isPlaying: readListeningParty()?.party.isPlaying ?? true,
      });
    });
  }, [isChoosing, partySong, current, player]);

  useEffect(() => {
    if (isChoosing || partySong === null) {
      return;
    }

    const heard = player.read();

    if (heard.current?.id !== partySong) {
      return;
    }

    if (isPartyPlaying && !heard.isPlaying) {
      player.resume();
    }

    if (!isPartyPlaying && heard.isPlaying) {
      player.pause();
    }
  }, [isChoosing, partySong, isPartyPlaying, current, player]);

  useEffect(() => {
    if (isChoosing || partySong === null || referenceSeconds === null) {
      return;
    }

    const heard = player.read();

    if (heard.current?.id !== partySong || !heard.isPlaying || heard.isLoading) {
      return;
    }

    if (Math.abs(heard.positionSeconds - referenceSeconds) > DRIFT_SECONDS) {
      player.seek(referenceSeconds);
    }
  }, [isChoosing, partySong, referenceSeconds, player]);

  useEffect(() => {
    if (partyId === null) {
      return;
    }

    const tell = () => {
      const heard = player.read();

      report({
        positionSeconds: heard.positionSeconds,
        bufferedAheadSeconds: 0,
        isWatching: heard.isPlaying,
        isReady: !heard.isLoading,
      });
    };

    tell();

    const timer = setInterval(tell, REPORT_EVERY_MS);

    return () => {
      clearInterval(timer);
    };
  }, [partyId, current, state.isPlaying, player, report]);
};

export { useListenAlong };
