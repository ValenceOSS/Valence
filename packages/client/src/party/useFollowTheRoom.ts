import { useCallback, useEffect, useRef } from 'react';
import { correctDrift } from '@ValenceCore/functions/correctDrift';
import { whatToReport } from '@ValenceCore/functions/whatToReport';
import { describeCommand } from '@ValenceClient/party/describeCommand';
import type { PartyPlayback } from '@ValenceClient/party/PartyPlayback';
import type { RoomPlayer } from '@ValenceClient/party/RoomPlayer';

const REPORT_EVERY_MS = 1000;

const CATCH_UP_BEYOND_SECONDS = 2;

const LINE_UP_BEYOND_SECONDS = 0.05;

const HAVE_METADATA = 1;

type FollowTheRoom = {
  party: PartyPlayback | undefined;
  playerOf: () => RoomPlayer | null;
  isSessionPlaying: boolean;
  onSaid: (said: string) => void;
  onCannotStart: () => void;
};

/**
 * Keeps one player in step with the watch party it is part of, whichever client it is drawn by —
 * the browser's video element, the phone's player or the television's — through the few things each
 * of them can be asked to do.
 *
 * Five things, each its own effect because each answers to something different. Joining part-way
 * through jumps straight to where the room is, once, rather than easing there. A command somebody
 * sent is applied once, by its sequence, and said aloud. The player runs while the room runs and
 * nobody is holding it up, and stops otherwise, rather than deciding for itself. Where it is, and
 * whether it could play, is reported every second, from the last position known to be real while
 * a stream is being rebuilt. And small drift is closed by playing a little faster or slower, large
 * drift by jumping, while a held room lines everybody up on the same frame.
 *
 * The player is asked for at the moment it is needed rather than held, since a client's player can
 * be replaced underneath — a new session, a new element — without the party changing.
 *
 * @param party - The party this viewing is part of, or nothing where it is not part of one.
 * @param playerOf - The player as it is now, or nothing before there is one.
 * @param isSessionPlaying - Whether the stream is up and playing, rather than being started or rebuilt.
 * @param onSaid - Told what somebody in the room did, to say on screen.
 * @param onCannotStart - Told the player refused to start when the room did, as a browser can.
 * @returns How to say where a fresh stream starts, which is the last position known to be real
 *   until it has played.
 */
const useFollowTheRoom = ({
  party,
  playerOf,
  isSessionPlaying,
  onSaid,
  onCannotStart,
}: FollowTheRoom): { rememberWhere: (seconds: number) => void } => {
  const appliedSequenceRef = useRef(-1);
  const hasCaughtUpRef = useRef(false);
  const lastGoodRef = useRef(0);
  const partyRef = useRef(party);
  const isSessionPlayingRef = useRef(isSessionPlaying);
  const playerOfRef = useRef(playerOf);

  useEffect(() => {
    partyRef.current = party;
    isSessionPlayingRef.current = isSessionPlaying;
    playerOfRef.current = playerOf;
  });

  const reference = party?.referenceSeconds ?? null;

  useEffect(() => {
    const player = playerOfRef.current();

    if (
      party === undefined ||
      reference === null ||
      player === null ||
      hasCaughtUpRef.current ||
      player.readyState() < HAVE_METADATA
    ) {
      return;
    }

    hasCaughtUpRef.current = true;

    const showing = player.currentSeconds() + player.frameSkewSeconds();

    if (Math.abs(reference - showing) > CATCH_UP_BEYOND_SECONDS) {
      player.seekTo(reference - player.frameSkewSeconds());
    }
  }, [party, reference, party?.meConnectionId]);

  const command = party?.command ?? null;
  const meConnectionId = party?.meConnectionId ?? null;

  useEffect(() => {
    const player = playerOfRef.current();

    if (command === null || player === null || command.sequence <= appliedSequenceRef.current) {
      return;
    }

    appliedSequenceRef.current = command.sequence;

    const said = describeCommand(command, meConnectionId);

    if (said !== null) {
      onSaid(said);
    }

    if (command.command.kind !== 'changeWhatIsPlaying') {
      player.seekTo(command.command.atSeconds);
    }
  }, [command, meConnectionId, onSaid]);

  const isPlaying = party?.isPlaying ?? false;
  const isHeld = party?.isHeld ?? false;
  const isInAParty = party !== undefined;

  useEffect(() => {
    const player = playerOfRef.current();

    if (!isInAParty || player === null || !isSessionPlaying) {
      return;
    }

    const shouldRun = isPlaying && !isHeld;

    if (shouldRun && player.isPaused()) {
      player.play().catch(onCannotStart);

      return;
    }

    if (!shouldRun && !player.isPaused()) {
      player.pause();
    }
  }, [party, isInAParty, isPlaying, isHeld, isSessionPlaying, onCannotStart]);

  useEffect(() => {
    if (!isInAParty) {
      return;
    }

    const timer = setInterval(() => {
      const player = playerOfRef.current();
      const held = partyRef.current;

      if (player === null || held === undefined) {
        return;
      }

      const ahead = player.bufferedAheadSeconds();
      const said = whatToReport({
        isSessionPlaying: isSessionPlayingRef.current,
        frameSkewSeconds: player.frameSkewSeconds(),
        readyState: player.readyState(),
        currentSeconds: player.currentSeconds(),
        lastGoodSeconds: lastGoodRef.current,
        bufferedAheadSeconds: ahead,
        isPaused: player.isPaused(),
      });

      lastGoodRef.current = said.positionSeconds;

      held.onReport({ ...said, bufferedAheadSeconds: ahead });
    }, REPORT_EVERY_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isInAParty]);

  useEffect(() => {
    const player = playerOfRef.current();
    const held = partyRef.current;

    if (held === undefined || reference === null || player === null) {
      return;
    }

    if (player.isPaused() && !held.isHeld) {
      return;
    }

    const showing = player.currentSeconds() + player.frameSkewSeconds();

    if (held.isHeld && player.isPaused()) {
      if (Math.abs(reference - showing) > LINE_UP_BEYOND_SECONDS) {
        player.seekTo(reference - player.frameSkewSeconds());
      }

      return;
    }

    const corrected = correctDrift({
      behindByMs: (reference - showing) * 1000,
      jitterMs: held.jitterMs,
      isSeeking: player.isSeeking(),
      isStalled: player.bufferedAheadSeconds() <= 0,
    });

    if (corrected.kind === 'snap') {
      player.seekTo(reference - player.frameSkewSeconds());
      player.setRate(1);

      return;
    }

    if (player.isPaused()) {
      return;
    }

    player.setRate(corrected.kind === 'rate' ? corrected.rate : 1);
  }, [party, reference]);

  const rememberWhere = useCallback((seconds: number) => {
    lastGoodRef.current = seconds;
  }, []);

  return { rememberWhere };
};

export type { FollowTheRoom };

export { useFollowTheRoom };
