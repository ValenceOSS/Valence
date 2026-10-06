import { Sparkles as SparklesIcon } from '@keyline-icons/react';
import { fetchMix } from '@ValenceClient/music/fetchMixes';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { MusicShelf } from '@ValenceScreens/components/MusicShelf/MusicShelf';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import type { MixShelfProps } from './MixShelf.types';
import { say } from '@ValenceI18n/say';

/**
 * The mixes Valence made for this profile today, each opening its page or playing straight away —
 * or nothing at all where there are none yet.
 *
 * @param mixes - The mixes.
 */
const MixShelf = ({ mixes }: MixShelfProps) => {
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();

  if (mixes.length === 0) {
    return null;
  }

  return (
    <MusicShelf
      heading={say('common.madeForYou')}
      tiles={mixes.map((mix) => ({
        key: mix.id,
        tile: (
          <MusicTile
            title={mix.title}
            detail={mix.detail}
            artwork={
              <PlaylistCover
                name={mix.title}
                albumIds={mix.coverAlbumIds}
                standIn={SparklesIcon}
                iconSize={40}
                className="w-full"
              />
            }
            onOpen={() => {
              open({ kind: 'mix', id: mix.id });
            }}
            onPlay={() => {
              void fetchMix(mix.id).then((read) => {
                player.play(read.tracks, 0, {
                  source: { kind: 'tracks', id: mix.id, name: mix.title },
                });
              });
            }}
          />
        ),
      }))}
    />
  );
};

MixShelf.displayName = 'MixShelf';

export { MixShelf };
