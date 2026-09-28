import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { Button } from '@ValenceMobile/components/Button/Button';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { AMediaBlockProps } from './AMediaBlock.types';

/**
 * A title from the library that a plugin points to, drawn as the app draws any title — from the
 * library's own record of it, not from anything the plugin said about it — and opening its page.
 *
 * @param mediaId - The title.
 * @param onLookAt - Told to open its page, where the page it sits on can.
 */
const AMediaBlock = ({ mediaId, onLookAt }: AMediaBlockProps) => {
  const read = useQuery(libraryQueries.detail(mediaId));
  const title = read.data;

  if (title === undefined || title === null) {
    return null;
  }

  const name = title.metadata.seriesTitle ?? title.title;
  const poster = (
    <APoster
      title={name}
      year={title.year ?? null}
      artwork={
        title.metadata.hasPoster ? onThisServer(`/api/media/${title.id}/image/poster`) : null
      }
    />
  );

  return onLookAt === undefined ? (
    poster
  ) : (
    <Button
      tone="bare"
      label={name}
      onPress={() => {
        onLookAt(mediaId);
      }}
    >
      {poster}
    </Button>
  );
};

AMediaBlock.displayName = 'AMediaBlock';

export { AMediaBlock };
