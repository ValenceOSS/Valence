import { Heart, MoreHorizontal } from '@keyline-icons/react-native';
import { Heart as HeartFilled } from '@keyline-icons/react-native/fill';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { ASplitButton } from '@ValenceMobile/components/ASplitButton/ASplitButton';
import { Words } from '@ValenceMobile/components/Words/Words';
import { AEqualiser } from '@ValenceMobile/components/AEqualiser/AEqualiser';
import { asAClock } from '@ValenceMobile/components/Watching/asAClock';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ATrackRowProps } from './ATrackRow.types';
import { say } from '@ValenceI18n/say';

const ART = 48;

const styles = StyleSheet.create({
  over: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 6,
    justifyContent: 'center',
  },
  art: { borderRadius: 6, height: ART, width: ART },
  explicit: { borderRadius: 3, borderWidth: 1, paddingHorizontal: 3 },
  lead: { alignItems: 'center', justifyContent: 'center', minWidth: 24 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 10 },
  said: { flex: 1, gap: 2 },
  side: { alignItems: 'center', flexDirection: 'row', gap: 6 },
});

/**
 * One track in a list, as the library lists a programme's episodes: its number on an album or its
 * cover anywhere else, what it is called, who it is by and how long it runs, and beside it a split
 * button to like it, lit where it is liked, and to open a menu of what else can be done with it.
 * The one playing now is picked out in bold.
 *
 * It is drawn again only when something it shows changes, so a long list does not redraw every row
 * whenever the music does.
 *
 * @param track - The track.
 * @param at - Its place in the list, handed back when it is pressed.
 * @param number - Its number on its album, where the list is an album's.
 * @param artwork - Its album's cover, where the list mixes albums.
 * @param isCurrent - Whether it is the song now playing, which is marked by moving bars in place of
 *   its number, or over its cover.
 * @param isPlaying - Whether that song is playing rather than paused, which keeps the bars still.
 * @param isLiked - Whether it is liked.
 * @param onPlay - Told to play from its place.
 * @param menuOf - What else can be done with the track at its place, for the native menu that
 *   drops from its segment.
 * @param onLike - Told to like or unlike the track at its place, where the list offers it, from the
 *   segment beside its menu.
 */
const OneTrack = ({
  track,
  at,
  number,
  artwork,
  isCurrent,
  isPlaying = false,
  isLiked,
  onPlay,
  menuOf,
  onLike,
}: ATrackRowProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.row}>
      <View style={styles.said}>
        <Button
          tone="bare"
          label={say('common.playTitle', { title: track.title })}
          onPress={() => {
            onPlay(at);
          }}
        >
          <View style={styles.side}>
            {artwork === null ? (
              <View style={styles.lead}>
                {isCurrent ? (
                  <AEqualiser
                    label={say('common.playing')}
                    isMoving={isPlaying}
                    colour={colours.accent}
                  />
                ) : (
                  <Words size="small" tone="muted">
                    {number === null ? '' : number.toString()}
                  </Words>
                )}
              </View>
            ) : (
              <View>
                <ARemotePicture style={styles.art} uri={artwork} />
                {isCurrent ? (
                  <View style={[StyleSheet.absoluteFill, styles.over]}>
                    <AEqualiser
                      label={say('common.playing')}
                      isMoving={isPlaying}
                      colour="#ffffff"
                    />
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.said}>
              <Words lines={1} isStrong={isCurrent} {...(isCurrent ? { tone: 'accent' } : {})}>
                {track.title}
              </Words>
              <View style={styles.side}>
                {track.isExplicit ? (
                  <View style={[styles.explicit, { borderColor: colours.textMuted }]}>
                    <Words size="small" tone="muted" isStrong>
                      {say('common.e')}
                    </Words>
                  </View>
                ) : null}
                <Words size="small" tone="muted" lines={1}>
                  {[
                    track.artists.map((one) => one.name).join(', '),
                    asAClock(track.durationSeconds),
                  ].join(' · ')}
                </Words>
              </View>
            </View>
          </View>
        </Button>
      </View>

      <ASplitButton
        parts={[
          ...(onLike === undefined
            ? []
            : [
                {
                  icon: isLiked ? HeartFilled : Heart,
                  label: isLiked
                    ? say('common.unlikeTitle', { title: track.title })
                    : say('common.likeTitle', { title: track.title }),
                  isChosen: isLiked,
                  onPress: () => {
                    onLike(at);
                  },
                },
              ]),
          {
            icon: MoreHorizontal,
            label: say('common.moreForTitle', { title: track.title }),
            menu: { title: track.title, items: menuOf(at) },
          },
        ]}
      />
    </View>
  );
};

const ATrackRow = memo(OneTrack);

ATrackRow.displayName = 'ATrackRow';

export { ATrackRow };
