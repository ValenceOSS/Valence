import { useTheBook } from '@ValenceMobile/hooks/useTheBook';
import { AMiniProgress } from '@ValenceMobile/components/TheNowPlayingBar/components/AMiniProgress/AMiniProgress';

/**
 * How far through the book playing it has got, following it as it plays. It is its own component
 * so the book moving on redraws this line alone rather than the whole bar.
 */
const ABookProgress = () => {
  const { state } = useTheBook({ followsPosition: true });

  return (
    <AMiniProgress
      positionSeconds={state.bookPositionSeconds}
      durationSeconds={state.durationSeconds}
    />
  );
};

ABookProgress.displayName = 'ABookProgress';

export { ABookProgress };
