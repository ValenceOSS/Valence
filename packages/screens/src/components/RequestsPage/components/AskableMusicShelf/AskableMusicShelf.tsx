import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { AskableMusicTile } from '@ValenceScreens/components/RequestsPage/components/AskableMusicTile/AskableMusicTile';
import type { AskableMusicShelfProps } from './AskableMusicShelf.types';

/**
 * One shelf of albums or artists to ask for, drawn as covers and faces rather than as posters.
 *
 * @param shelf - What is on the shelf.
 * @param onAsk - Called with the album or artist to open, as its address names it.
 */
const AskableMusicShelf = ({ shelf, onAsk }: AskableMusicShelfProps) => (
  <Rail title={shelf.title} sizesCards>
    {shelf.titles.map((title, at) => (
      <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
        <AskableMusicTile title={title} onAsk={onAsk} />
      </RevealItem>
    ))}
  </Rail>
);

AskableMusicShelf.displayName = 'AskableMusicShelf';

export { AskableMusicShelf };
