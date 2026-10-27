import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { useLikeThis } from '@ValenceClient/library/useLikeThis';
import { RailCard } from '@ValenceScreens/components/RailCard/RailCard';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { say } from '@ValenceI18n/say';
import type { LikeThisShelfProps } from './LikeThisShelf.types';

/**
 * A row of the films and programmes in the libraries most like a title, on that title's page, a
 * programme standing as one poster that opens it. Nothing is drawn where nothing is alike.
 *
 * @param mediaId - The film, or any episode of the programme.
 * @param onPlay - Told to play one, from the start.
 * @param onInspect - Told to open a film's page.
 * @param onOpenShow - Told to open a programme's page.
 */
const LikeThisShelf = ({ mediaId, onPlay, onInspect, onOpenShow }: LikeThisShelfProps) => {
  const alike = useLikeThis(mediaId);

  if (alike.length === 0) {
    return null;
  }

  return (
    <DialogSection>
      <Rail
        title={say('common.moreLikeThis')}
        sizesCards
        hasArrows={false}
        look="section"
        className="px-0"
      >
        {alike.map((media, at) => (
          <RevealItem key={media.id} index={at} className="shrink-0 snap-start">
            <RailCard
              media={media}
              shape="poster"
              isSeries={media.seriesId !== null}
              onPlay={onPlay}
              onInspect={onInspect}
              onOpenShow={onOpenShow}
            />
          </RevealItem>
        ))}
      </Rail>
    </DialogSection>
  );
};

LikeThisShelf.displayName = 'LikeThisShelf';

export { LikeThisShelf };
