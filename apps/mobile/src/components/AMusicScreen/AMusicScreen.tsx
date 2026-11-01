import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { StyleSheet, View } from 'react-native';
import { ACoverGrid } from '@ValenceMobile/components/ACoverGrid/ACoverGrid';
import { ATintedGround } from '@ValenceMobile/components/ATintedGround/ATintedGround';
import { ATitleHead } from '@ValenceMobile/components/ATitleHead/ATitleHead';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { usePictureTint } from '@ValenceMobile/hooks/usePictureTint';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { GROUND } from '@ValenceMobile/theme/GROUND';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AMusicScreenProps } from './AMusicScreen.types';

const STAND_IN_SIZE = 96;

const styles = StyleSheet.create({
  standIn: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});

/**
 * The page of an album, an artist, a playlist, a mix or liked songs, drawn as a title's page is:
 * its cover edge to edge under the clock with its name across the foot of it, fading into a tint
 * taken from the cover, which the page beneath is lit with.
 *
 * A list of songs from many albums with no cover of its own shows the covers of four of them in
 * a grid, and anything with no cover at all a mark for what it is.
 *
 * @param title - What it is called.
 * @param artwork - Its cover, or nothing where it has none.
 * @param albumIds - The albums whose covers make up its cover instead.
 * @param standIn - What is drawn where there is no cover.
 * @param onBack - Told somebody is done with it.
 * @param children - The rest of the page.
 */
const AMusicScreen = ({
  title,
  artwork,
  albumIds,
  standIn,
  onBack,
  children,
}: AMusicScreenProps) => {
  const colours = useTheColours();
  const [firstAlbum] = albumIds ?? [];
  const tint = usePictureTint(
    artwork ?? (firstAlbum === undefined ? null : onThisServer(albumArtworkUrl(firstAlbum))),
  );
  const drawn =
    albumIds !== undefined ? (
      <ACoverGrid albumIds={albumIds} standIn={standIn} iconSize={STAND_IN_SIZE} />
    ) : artwork === null ? (
      <View style={[styles.standIn, { backgroundColor: colours.surfaceRaised }]}>
        <Icon of={standIn} size={STAND_IN_SIZE} colour={colours.textMuted} />
      </View>
    ) : undefined;

  return (
    <GROUND.Provider value={tint}>
      <Screen
        scrolls
        title={title}
        onBack={onBack}
        head={
          <ATitleHead
            backdrop={artwork}
            lettering={null}
            title={title}
            {...(drawn === undefined ? {} : { drawn })}
            {...(tint === null ? {} : { ground: tint })}
          />
        }
        {...(tint === null ? {} : { behind: <ATintedGround tint={tint} /> })}
      >
        {children}
      </Screen>
    </GROUND.Provider>
  );
};

AMusicScreen.displayName = 'AMusicScreen';

export { AMusicScreen };
