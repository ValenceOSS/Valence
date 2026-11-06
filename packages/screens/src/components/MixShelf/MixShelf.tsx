import { fetchMix } from '@ValenceClient/music/fetchMixes';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { MusicShelf } from '@ValenceScreens/components/MusicShelf/MusicShelf';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { MixArtwork } from '@ValenceScreens/components/MixArtwork/MixArtwork';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { isPlayingFrom } from '@ValenceScreens/music/isPlayingFrom';
import type { MixShelfProps } from './MixShelf.types';

/**
 * A shelf of the mixes Valence made for this profile today, each opening its page or playing straight
 * away — or nothing at all where there are none yet.
 *
 * @param heading - What the mixes are.
 * @param mixes - The mixes.
 */
const MixShelf = ({ heading, mixes }: MixShelfProps) => {
  const { open } = useMusicNavigation();
  const { state, player } = useMusicPlayer();

  if (mixes.length === 0) {
    return null;
  }

  return (
    <MusicShelf
      heading={heading}
      size="large"
      tiles={mixes.map((mix, at) => ({
        key: mix.id,
        tile: (
          <MusicTile
            title={mix.title}
            isTitleShown={false}
            detail={mix.detail}
            artwork={
              <MixArtwork
                mix={mix}
                number={mixes.slice(0, at + 1).filter((one) => one.kind === 'daily').length}
              />
            }
            onOpen={() => {
              open({ kind: 'mix', id: mix.id });
            }}
            isPlaying={state.isPlaying && isPlayingFrom({ kind: 'mix', id: mix.id }, state)}
            onPlay={() => {
              if (isPlayingFrom({ kind: 'mix', id: mix.id }, state)) {
                player.toggle();

                return;
              }

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
