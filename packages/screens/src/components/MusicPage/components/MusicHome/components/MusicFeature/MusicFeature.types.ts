import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { MusicPlayer } from '@ValenceScreens/music/createMusicPlayer';

type MusicFeatureProps = {
  newest: MusicAlbum | null;
  player?: MusicPlayer;
};

export type { MusicFeatureProps };
