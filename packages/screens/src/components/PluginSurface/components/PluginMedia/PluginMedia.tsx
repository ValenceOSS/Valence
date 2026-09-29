import { useQuery } from '@tanstack/react-query';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Skeleton } from '@ValenceUI/Skeleton';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { PluginMediaProps } from './PluginMedia.types';

/**
 * A title from this library that a plugin pointed at, drawn as Valence draws any title and opening
 * its page when pressed. The plugin names only which title; what is shown is read from the library
 * here, so a plugin cannot dress one title up as another.
 *
 * @param mediaId - The title.
 */
const PluginMedia = ({ mediaId }: PluginMediaProps) => {
  const { go } = usePlace();
  const asked = useQuery(libraryQueries.detail(mediaId));

  if (asked.isPending) {
    return <Skeleton shape="soft" className="aspect-[2/3] w-32" />;
  }

  const media = asked.data ?? null;

  if (media === null) {
    return null;
  }

  return (
    <MediaCard
      title={media.metadata.seriesTitle ?? media.title}
      subtitle={typeof media.year === 'number' ? media.year.toString() : ''}
      imageUrl={artworkUrl(media.id, 'poster')}
      shape="poster"
      className="w-32"
      onSelect={() => {
        go({ inspecting: media.id });
      }}
    />
  );
};

PluginMedia.displayName = 'PluginMedia';

export { PluginMedia };
