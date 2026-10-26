import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { MusicMiniPlayer } from '@ValenceScreens/components/MusicMiniPlayer/MusicMiniPlayer';

/**
 * The song playing from what this device keeps, while there is no server: a way to pause it, carry
 * it on and stop it, and nothing that would need the server to open.
 */
const OfflineMusicBar = () => {
  const { state, player } = useMusicPlayer(theMusicPlayer(), { followsPosition: true });
  const playing = useWhatIsPlaying(state);

  if (playing === null) {
    return null;
  }

  return (
    <MusicMiniPlayer
      shown={playing}
      onOpen={() => {}}
      onTogglePlay={() => {
        if (playing.isPlaying) {
          player.pause();
        } else {
          player.resume();
        }
      }}
      onClose={() => {
        player.stop();
      }}
    />
  );
};

OfflineMusicBar.displayName = 'OfflineMusicBar';

export { OfflineMusicBar };
