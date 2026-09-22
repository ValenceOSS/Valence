import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import type { AskableMusicTileProps } from './AskableMusicTile.types';

/**
 * One album or artist that can be asked for, drawn as a tile: who it is by, where it stands with
 * this server, and pressing it opens the page for asking.
 *
 * @param title - The album or artist.
 * @param onAsk - Told what was chosen, in the form the address knows it by.
 */
const AskableMusicTile = ({ title, onAsk }: AskableMusicTileProps) => (
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
);

AskableMusicTile.displayName = 'AskableMusicTile';

export { AskableMusicTile };
