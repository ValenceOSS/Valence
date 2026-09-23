import { MoreHorizontal } from '@keyline-icons/react-native';
import { Heart as HeartFilled } from '@keyline-icons/react-native/fill';
import { Image, StyleSheet, View } from 'react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { asAClock } from '@ValencePhone/components/Watching/asAClock';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ATrackRowProps } from './ATrackRow.types';

const ART = 44;

const styles = StyleSheet.create({
  art: { borderRadius: 6, height: ART, width: ART },
  explicit: { borderRadius: 3, borderWidth: 1, paddingHorizontal: 3 },
  lead: { alignItems: 'center', justifyContent: 'center', minWidth: 24 },
  menu: { padding: 8 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 8 },
  said: { flex: 1, gap: 2 },
  side: { alignItems: 'center', flexDirection: 'row', gap: 6 },
});

/**
 * One track in a list, as the web lists them: its number on an album or its cover anywhere else,
 * what it is called and who it is by, whether it is liked, how long it runs, and a menu of what
 * else can be done with it. The one playing now is picked out in bold.
 *
 * @param track - The track.
 * @param number - Its number on its album, where the list is an album's.
 * @param artwork - Its album's cover, where the list mixes albums.
 * @param isCurrent - Whether it is the one playing.
 * @param isLiked - Whether it is liked.
 * @param onPlay - Told to play from it.
 * @param onMenu - Told to offer what else can be done with it.
 */
const ATrackRow = ({
  track,
  number,
  artwork,
  isCurrent,
  isLiked,
  onPlay,
  onMenu,
}: ATrackRowProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.row}>
      <View style={styles.said}>
        <Button tone="bare" label={`Play ${track.title}`} onPress={onPlay}>
          <View style={styles.side}>
            {artwork === null ? (
              <View style={styles.lead}>
                <Words size="small" tone={isCurrent ? 'accent' : 'muted'}>
                  {number === null ? '' : number.toString()}
                </Words>
              </View>
            ) : (
              <Image
                style={styles.art}
                source={{ uri: artwork }}
                accessibilityIgnoresInvertColors
              />
            )}

            <View style={styles.said}>
              <Words lines={1} isStrong={isCurrent}>
                {track.title}
              </Words>
              <View style={styles.side}>
                {track.isExplicit ? (
                  <View style={[styles.explicit, { borderColor: colours.textMuted }]}>
                    <Words size="small" tone="muted" isStrong>
                      E
                    </Words>
                  </View>
                ) : null}
                <Words size="small" tone="muted" lines={1}>
                  {track.artists.map((one) => one.name).join(', ')}
                </Words>
              </View>
            </View>
          </View>
        </Button>
      </View>

      {isLiked ? <Icon of={HeartFilled} size={14} colour={colours.danger} /> : null}

      <Words size="small" tone="muted">
        {asAClock(track.durationSeconds)}
      </Words>

      <Button tone="bare" label={`More for ${track.title}`} onPress={onMenu}>
        <View style={styles.menu}>
          <Icon of={MoreHorizontal} size={20} colour={colours.textMuted} />
        </View>
      </Button>
    </View>
  );
};

ATrackRow.displayName = 'ATrackRow';

export { ATrackRow };
