import { MoreHorizontal, MusicNote } from '@keyline-icons/react-native';
import { Sparkle as SparkleFilled } from '@keyline-icons/react-native/fill';
import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AComingTrackProps } from './AComingTrack.types';
import { say } from '@ValenceI18n/say';

const ART = 44;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    borderRadius: 6,
    height: ART,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ART,
  },
  fills: { height: '100%', width: '100%' },
  menu: { padding: 10 },
  picked: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  play: { flex: 1 },
  row: { alignItems: 'center', flexDirection: 'row' },
  said: { flex: 1, gap: 2 },
  track: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 6 },
});

/**
 * One song still to come in the queue, with its album's cover, which skips to it when pressed and
 * has a menu of what else can be done with it. A song smart shuffle mixed in is marked as one.
 *
 * @param track - The song.
 * @param at - Its place in the queue, handed back when it is pressed.
 * @param isPick - Whether smart shuffle mixed it in from the library.
 * @param onPlay - Told to skip to the song at its place.
 * @param onMenu - Told to offer what else can be done with the song at its place.
 */
const OneComingTrack = ({ track, at, isPick, onPlay, onMenu }: AComingTrackProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.row}>
      <View style={styles.play}>
        <Button
          tone="bare"
          label={say('common.playTitleNow', { title: track.title })}
          onPress={() => {
            onPlay(at);
          }}
        >
          <View style={styles.track}>
            <View style={[styles.art, { backgroundColor: colours.surfaceRaised }]}>
              {track.album.hasArtwork ? (
                <Image
                  style={styles.fills}
                  source={{ uri: onThisServer(albumArtworkUrl(track.album.id)) }}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Icon of={MusicNote} size={18} colour={colours.textMuted} />
              )}
            </View>
            <View style={styles.said}>
              <Words lines={1}>{track.title}</Words>
              {isPick ? (
                <View style={styles.picked}>
                  <Icon of={SparkleFilled} size={10} colour={colours.accent} />
                  <Words size="small" tone="accent" lines={1}>
                    {say('common.smartShuffle')}
                  </Words>
                  <Words size="small" tone="muted" lines={1}>
                    · {track.artists.map((artist) => artist.name).join(', ')}
                  </Words>
                </View>
              ) : (
                <Words size="small" tone="muted" lines={1}>
                  {track.artists.map((artist) => artist.name).join(', ')}
                </Words>
              )}
            </View>
          </View>
        </Button>
      </View>

      <Button
        tone="bare"
        label={say('common.moreForTitle', { title: track.title })}
        onPress={() => {
          onMenu(at, track.title);
        }}
      >
        <View style={styles.menu}>
          <Icon of={MoreHorizontal} size={20} colour={colours.textMuted} />
        </View>
      </Button>
    </View>
  );
};

const AComingTrack = memo(OneComingTrack);

AComingTrack.displayName = 'AComingTrack';

export { AComingTrack };
