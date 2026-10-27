import { useLikeThis } from '@ValenceClient/library/useLikeThis';
import { ACard } from '@ValenceMobile/components/ACard/ACard';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { say } from '@ValenceI18n/say';
import type { ALikeThisShelfProps } from './ALikeThisShelf.types';

/**
 * A shelf of the films and programmes in the libraries most like a title, on that title's page, a
 * programme standing as one poster that opens it. Nothing is drawn where nothing is alike.
 *
 * @param mediaId - The film, or any episode of the programme.
 * @param onLookAt - Told to open a film.
 * @param onLookAtShow - Told to open a programme.
 */
const ALikeThisShelf = ({ mediaId, onLookAt, onLookAtShow }: ALikeThisShelfProps) => {
  const alike = useLikeThis(mediaId);

  return alike.length === 0 ? null : (
    <AShelf title={say('common.moreLikeThis')}>
      {alike.map((media) => (
        <ACard
          key={media.id}
          media={media}
          asProgramme
          onLookAt={onLookAt}
          onLookAtShow={onLookAtShow}
        />
      ))}
    </AShelf>
  );
};

ALikeThisShelf.displayName = 'ALikeThisShelf';

export { ALikeThisShelf };
