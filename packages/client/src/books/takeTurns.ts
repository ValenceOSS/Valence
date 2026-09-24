type Playable = {
  read: () => { isPlaying: boolean };
  subscribe: (listener: () => void) => () => void;
  pause: () => void;
};

/**
 * Lets only one of two players play at once: as either starts, the other pauses, so starting a book
 * quiets the music and starting a song quiets the book, rather than the two talking over each other.
 *
 * @param one - One player.
 * @param other - The other.
 * @param onTurn - Told which of the two has just started.
 * @returns A way to stop.
 */
const takeTurns = (
  one: Playable,
  other: Playable,
  onTurn: (which: 'one' | 'other') => void = () => {},
): (() => void) => {
  const watch = (player: Playable, quieting: Playable, which: 'one' | 'other') => {
    let wasPlaying = player.read().isPlaying;

    return player.subscribe(() => {
      const isPlaying = player.read().isPlaying;

      if (isPlaying && !wasPlaying) {
        onTurn(which);

        if (quieting.read().isPlaying) {
          quieting.pause();
        }
      }

      wasPlaying = isPlaying;
    });
  };

  const stops = [watch(one, other, 'one'), watch(other, one, 'other')];

  return () => {
    stops.forEach((stop) => {
      stop();
    });
  };
};

export { takeTurns };
