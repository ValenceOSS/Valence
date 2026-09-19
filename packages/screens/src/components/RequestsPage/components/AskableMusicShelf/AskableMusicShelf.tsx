import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { describeStanding } from '@ValenceScreens/components/AskableDialog/describeStanding';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { askingOf } from '@ValenceScreens/requests/askingOf';
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
        <MusicTile
          title={title.title}
          detail={[title.subtitle, describeStanding(title.standing)?.label ?? null]
            .filter((part) => part !== null)
            .join(' · ')}
          shape={title.kind === 'artist' ? 'round' : 'square'}
          artwork={
            <MusicArtwork
              src={title.posterUrl}
              label={`The cover of ${title.title}`}
              shape={title.kind === 'artist' ? 'round' : 'square'}
              className="w-full"
            />
          }
          onOpen={() => {
            onAsk(askingOf(title));
          }}
        />
      </RevealItem>
    ))}
  </Rail>
);

AskableMusicShelf.displayName = 'AskableMusicShelf';

export { AskableMusicShelf };
