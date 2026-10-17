import { Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Shuffle as ShuffleIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { PlayAndShuffleProps } from './PlayAndShuffle.types';

/**
 * The two ways to start a list of tracks at the head of an album, a playlist, a mix or the liked
 * songs: a large play from the first track, and shuffle from anywhere in it. Both wait while the
 * list is empty.
 *
 * @param tracks - What is played.
 * @param source - Where the tracks came from, so the queue can say.
 * @param playLabel - What the play button does, in words.
 * @param shuffleLabel - What the shuffle button does, in words.
 * @param isOrdered - Whether the list is meant to be heard in its order, which plays it so and
 *   leaves nothing to shuffle.
 */
const PlayAndShuffle = ({
  tracks,
  source,
  playLabel,
  shuffleLabel,
  isOrdered = false,
}: PlayAndShuffleProps) => {
  const { player } = useMusicPlayer();

  return (
    <>
      <Button
        variant="confirm"
        size="lg"
        isIconOnly
        label={playLabel}
        className="size-14"
        disabled={tracks.length === 0}
        onClick={() => {
          player.play(tracks, 0, { source, isOrdered });
        }}
      >
        <Icon of={PlayFilledIcon} size={24} />
      </Button>

      <Button
        variant="ghost"
        size="md"
        isIconOnly
        label={shuffleLabel}
        disabled={tracks.length === 0 || isOrdered}
        onClick={() => {
          player.play(tracks, Math.floor(Math.random() * tracks.length), {
            source,
            isOrdered,
            isShuffled: true,
          });
        }}
      >
        <Icon of={ShuffleIcon} size={22} />
      </Button>
    </>
  );
};

PlayAndShuffle.displayName = 'PlayAndShuffle';

export { PlayAndShuffle };
