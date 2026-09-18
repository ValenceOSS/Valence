import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  RepeatOne01Icon,
  ShuffleIcon,
} from '@hugeicons/core-free-icons';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Slider } from '@ValenceUI/Slider';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import { fadeVariants, spring, stillTransition } from '@ValenceUI/animations/reveal';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { BarButton } from '@ValenceScreens/components/BarButton/BarButton';
import { useListeningParty } from '@ValenceScreens/music/listeningParty';
import type { Variants } from 'motion/react';
import type { MusicTransportProps } from './MusicTransport.types';

const POPPING: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  shown: { opacity: 1, scale: 1 },
  gone: { opacity: 0, scale: 0.5 },
};

const REPEAT_LABELS = {
  off: 'Repeat everything',
  all: 'Repeat this song',
  one: 'Stop repeating',
} as const;

/**
 * The buttons that drive the song playing and the track that shows how far through it is: shuffle,
 * back, play, forward, repeat, and the time gone and left.
 *
 * Drawn on the player bar as a compact middle column, and in the immersive view as a quiet block
 * beneath the cover — the scrubber first with the time either side of it, the buttons spread
 * across below. Either way they behave the same. In somebody else's listening party the song and
 * where it has got to are the host's, so skipping, pausing and moving through the song are handed
 * to them — unless they have let everybody — and a listener whose browser would not start the
 * music on its own can still press play to join in. Shuffle and repeat are switched off for a
 * queue whose order means something, and for another device being controlled.
 *
 * Dragging along the track moves the handle and the time with the finger, and the song only goes
 * there when it is let go: each move to a new place in a song asks the server for it afresh, and a
 * drag that did that at every step never let the song settle anywhere.
 *
 * @param state - What the player is doing.
 * @param shown - What the bar shows as playing, which is another device's song while controlling it.
 * @param player - The player to drive.
 * @param look - On the bar, or in the immersive view.
 */
const MusicTransport = ({ state, shown, player, look = 'bar' }: MusicTransportProps) => {
  const listening = useListeningParty();
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const isImmersive = look === 'immersive';
  const { queue } = state;
  const isOrdered = queue?.isOrdered === true;
  const repeat = queue?.repeat ?? 'off';
  const isFollowing = listening !== null && !listening.mayChoose;
  const mayJoinIn = isFollowing && !shown.isPlaying && listening.party.isPlaying;
  const mayPlayPause = !isFollowing || listening.mayPlayPause || mayJoinIn;
  const maySeek = !isFollowing || listening.maySeek;
  const iconSize = isImmersive ? 24 : 20;
  const [scrubbedTo, setScrubbedTo] = useState<number | null>(null);
  const position = scrubbedTo ?? shown.positionSeconds;

  const seek = (value: number) => {
    setScrubbedTo(null);

    if (isFollowing) {
      listening.send({ kind: 'seek', atSeconds: value });

      return;
    }

    player.seek(value);
  };

  const scrubber = (
    <Slider
      label="Where the song is"
      tone={isImmersive ? 'overlay' : 'glass'}
      value={Math.min(position, shown.durationSeconds)}
      max={Math.max(shown.durationSeconds, 1)}
      step={1}
      valueLabel={(value) => formatDuration(value)}
      isDisabled={!maySeek}
      revealsThumb
      className="min-w-0 flex-1"
      onValueChange={setScrubbedTo}
      onValueCommit={seek}
    />
  );

  const shuffle = (
    <BarButton
      label={queue?.isShuffled === true ? 'Stop shuffling' : 'Shuffle'}
      glyph={ShuffleIcon}
      gesture="tumble"
      isLit={queue?.isShuffled === true}
      isDisabled={isOrdered || shown.remote !== null || isFollowing}
      className={isImmersive ? '' : 'hidden md:inline-flex'}
      onClick={() => {
        player.toggleShuffle();
      }}
    />
  );

  const repeating = (
    <BarButton
      label={REPEAT_LABELS[repeat]}
      glyph={repeat === 'one' ? RepeatOne01Icon : RepeatIcon}
      gesture="spin"
      isLit={repeat !== 'off'}
      isDisabled={isOrdered || shown.remote !== null || isFollowing}
      className={isImmersive ? '' : 'hidden md:inline-flex'}
      onClick={() => {
        player.cycleRepeat();
      }}
    />
  );

  const middle = (
    <>
      <BarButton
        label="Previous"
        glyph={PreviousIcon}
        iconSize={iconSize}
        isSolid
        isDisabled={isFollowing}
        onClick={() => {
          player.previous();
        }}
      />

      <Button
        variant={isImmersive ? 'ghost' : 'glossy'}
        size={isImmersive ? 'md' : 'sm'}
        isIconOnly
        label={shown.isPlaying ? 'Pause' : 'Play'}
        className={cn('relative', isImmersive ? 'size-14' : 'size-8')}
        disabled={!mayPlayPause}
        onClick={() => {
          if (isFollowing && !mayJoinIn) {
            listening.send({
              kind: shown.isPlaying ? 'pause' : 'play',
              atSeconds: shown.positionSeconds,
            });

            return;
          }

          if (shown.isPlaying) {
            player.pause();
          } else {
            player.resume();
          }
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={
              shown.isLoading && shown.isPlaying ? 'loading' : shown.isPlaying ? 'pause' : 'play'
            }
            variants={isStill ? fadeVariants : POPPING}
            initial="hidden"
            animate="shown"
            exit="gone"
            transition={isStill ? stillTransition : spring}
            className="flex"
          >
            {shown.isLoading && shown.isPlaying ? (
              <Spinner size="sm" label="Loading" />
            ) : (
              <Icon
                of={shown.isPlaying ? PauseIcon : PlayIcon}
                size={isImmersive ? 36 : 18}
                isActive
              />
            )}
          </motion.span>
        </AnimatePresence>
      </Button>

      <BarButton
        label="Next"
        glyph={NextIcon}
        iconSize={iconSize}
        isSolid
        isDisabled={isFollowing}
        onClick={() => {
          player.next();
        }}
      />
    </>
  );

  if (isImmersive) {
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-1">
          {scrubber}
          <div className="flex justify-between text-xs tabular-nums text-on-scrim/60">
            <span>{formatDuration(position)}</span>
            <span>-{formatDuration(Math.max(shown.durationSeconds - position, 0))}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {shuffle}
          <div className="flex items-center gap-4">{middle}</div>
          {repeating}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <div className="flex items-center gap-1 sm:gap-2">
        {shuffle}
        {middle}
        {repeating}
      </div>

      <div className="hidden w-full items-center gap-2 md:flex">
        <span className="w-10 text-right text-xs tabular-nums text-text-muted">
          {formatDuration(position)}
        </span>
        {scrubber}
        <span className="w-10 text-xs tabular-nums text-text-muted">
          {formatDuration(shown.durationSeconds)}
        </span>
      </div>
    </div>
  );
};

MusicTransport.displayName = 'MusicTransport';

export { MusicTransport };
