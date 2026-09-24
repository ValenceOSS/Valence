import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';

/**
 * How far through the song the music is, in seconds, drawing again as it moves — here, or on the
 * device this phone is driving. Only what shows it should ask, since it changes twice a second.
 *
 * @returns Where the song is.
 */
const useWhereTheSongIs = (): number => {
  const { state } = useTheMusic({ followsPosition: true });

  return useWhatIsPlaying(state)?.positionSeconds ?? state.positionSeconds;
};

export { useWhereTheSongIs };
