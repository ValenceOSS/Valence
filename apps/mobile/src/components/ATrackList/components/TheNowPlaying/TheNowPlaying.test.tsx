import { useContext } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { NOW_PLAYING } from '@ValenceMobile/components/ATrackList/NOW_PLAYING';
import { TheNowPlaying } from './TheNowPlaying';

/**
 * Says which song it is told is playing.
 *
 * @returns What it was told.
 */
const Told = () => {
  const { currentId } = useContext(NOW_PLAYING);

  return <Text>{currentId ?? 'nothing'}</Text>;
};

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheNowPlaying', () => {
  it('tells what is beneath it which song is playing', async () => {
    const drawn = await render(
      <TheNowPlaying>
        <Told />
      </TheNowPlaying>,
      { wrapper: CacheScope },
    );

    thePhonesMusicPlayer().play([aTrack(3)], 0, {
      source: { kind: 'album', id: 'arcadia', name: 'Even In Arcadia' },
    });

    await waitFor(() => {
      expect(drawn.getByText(aTrack(3).id)).toBeTruthy();
    });
  });
});
