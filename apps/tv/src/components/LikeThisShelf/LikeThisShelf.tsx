import { useLikeThis } from '@ValenceClient/library/useLikeThis';
import { Shelf } from '@ValenceTv/components/Shelf/Shelf';
import { say } from '@ValenceI18n/say';
import type { LikeThisShelfProps } from './LikeThisShelf.types';

/**
 * A shelf of the films and programmes in the libraries most like a title, beneath that title's page,
 * a programme standing as one card that opens it. Nothing is drawn where nothing is alike.
 *
 * @param mediaId - The film, or any episode of the programme.
 * @param progress - How far through each title this viewer is.
 * @param onOpen - Told to open a title's page.
 */
const LikeThisShelf = ({ mediaId, progress, onOpen }: LikeThisShelfProps) => {
  const alike = useLikeThis(mediaId);

  return alike.length === 0 ? null : (
    <Shelf title={say('common.moreLikeThis')} items={alike} progress={progress} onOpen={onOpen} />
  );
};

LikeThisShelf.displayName = 'LikeThisShelf';

export { LikeThisShelf };
