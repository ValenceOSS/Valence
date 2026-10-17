import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { BarButton } from '@ValenceScreens/components/BarButton/BarButton';
import { KeepHeart } from '@ValenceScreens/components/KeepHeart/KeepHeart';
import type { LikeTrackButtonProps } from './LikeTrackButton.types';
import { say } from '@ValenceI18n/say';

/**
 * The heart beside the track that is playing, the same in the player's bar and in the full-screen
 * player: it fills when pressed, and keeps the track in the profile's liked songs or lets it go.
 *
 * @param trackId - The track.
 * @param title - What the track is called, for the button's name.
 * @param isDisabled - Whether nothing is playing to like.
 * @param className - Extra classes for the caller's own layout.
 */
const LikeTrackButton = ({
  trackId,
  title,
  isDisabled = false,
  className,
}: LikeTrackButtonProps) => {
  const favourites = useFavourites(useWatchingProfile());
  const isLiked = favourites.isKept(trackId);

  return (
    <BarButton
      label={isLiked ? say('common.unlikeTitle', { title }) : say('common.likeTitle', { title })}
      face={<KeepHeart isKept={isLiked} size={18} />}
      gesture="fill"
      isLit={isLiked}
      isDisabled={isDisabled}
      {...(className === undefined ? {} : { className })}
      onClick={() => {
        favourites.toggle(trackId);
      }}
    />
  );
};

LikeTrackButton.displayName = 'LikeTrackButton';

export { LikeTrackButton };
