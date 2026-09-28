import { useQuery } from '@tanstack/react-query';
import { summariseDetail } from '@ValenceClient/library/summariseDetail';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import type { PluginMediaProps } from './PluginMedia.types';

/**
 * A title from the library that a plugin points to, drawn as the television draws any title: from
 * the library's own record of it, not from anything the plugin said about it.
 *
 * @param mediaId - The title.
 */
const PluginMedia = ({ mediaId }: PluginMediaProps) => {
  const read = useQuery(libraryQueries.detail(mediaId));

  if (read.data === undefined || read.data === null) {
    return null;
  }

  return <MediaCard media={summariseDetail(read.data)} shape="poster" onPress={() => undefined} />;
};

PluginMedia.displayName = 'PluginMedia';

export { PluginMedia };
