import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { AMiniProgress } from '@ValenceMobile/components/TheNowPlayingBar/components/AMiniProgress/AMiniProgress';

/**
 * How far through the song playing it has got, following it as it plays. It is its own component
 * so the song moving on redraws this line alone rather than the whole bar.
 */
const ASongProgress = () => {
  const { state } = useTheMusic({ followsPosition: true });
  const shown = useWhatIsPlaying(state);

  return (
    <AMiniProgress
      positionSeconds={shown?.positionSeconds ?? state.positionSeconds}
      durationSeconds={shown?.durationSeconds ?? state.current?.durationSeconds ?? 0}
    />
  );
};

ASongProgress.displayName = 'ASongProgress';

export { ASongProgress };
