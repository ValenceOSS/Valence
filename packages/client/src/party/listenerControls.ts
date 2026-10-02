import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';
import type { ListeningParty } from '@ValenceClient/party/listeningParty';

type Heard = {
  isPlaying: boolean;
  positionSeconds: number;
};

type ListenerControls = {
  isFollowing: boolean;
  mayPlayPause: boolean;
  maySeek: boolean;
  playPause: () => void;
  seek: (seconds: number) => void;
};

/**
 * What the music controls may do, and what pressing them does, for somebody who may be in
 * somebody else's listening party. There the song and where it has got to are the host's, so
 * pausing and moving through the song are handed to them unless they have let everybody, and
 * skipping, shuffling and repeating are not this listener's to do. A listener whose music would not
 * start on its own can still press play to join in. Outside a party, or hosting one, the player is
 * simply driven.
 *
 * @param listening - The listening party this client is in, or nothing.
 * @param heard - Whether the song is playing, and where it has got to.
 * @param player - The player to drive.
 * @returns What may be pressed, and what pressing does.
 */
const listenerControls = (
  listening: ListeningParty | null,
  heard: Heard,
  player: Pick<MusicPlayer, 'pause' | 'resume' | 'seek'>,
): ListenerControls => {
  const isFollowing = listening !== null && !listening.mayChoose;
  const mayJoinIn = isFollowing && !heard.isPlaying && listening.party.isPlaying;

  return {
    isFollowing,
    mayPlayPause: !isFollowing || listening.mayPlayPause || mayJoinIn,
    maySeek: !isFollowing || listening.maySeek,
    playPause: () => {
      if (isFollowing && !mayJoinIn) {
        listening.send({
          kind: heard.isPlaying ? 'pause' : 'play',
          atSeconds: heard.positionSeconds,
        });

        return;
      }

      if (heard.isPlaying) {
        player.pause();
      } else {
        player.resume();
      }
    },
    seek: (seconds) => {
      if (isFollowing) {
        listening.send({ kind: 'seek', atSeconds: seconds });

        return;
      }

      player.seek(seconds);
    },
  };
};

export type { ListenerControls };

export { listenerControls };
