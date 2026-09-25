import { StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { TrickplayThumb } from '@ValenceTv/screens/Player/components/TrickplayThumb/TrickplayThumb';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { ScrubberProps } from './Scrubber.types';

const TRACK = 8;

const TRACK_FOCUSED = 14;

const THUMB = 26;

const PREVIEW_WIDTH = 400;

/**
 * How far through a title playing is, as a bar between the time gone and the time left, which the
 * remote can land on to scrub.
 *
 * While the remote is on it, the bar thickens and left and right move a cursor along it; above the
 * cursor sits the picture at that moment, cut from the title's thumbnails, with its time beneath —
 * carried along the bar in step with the cursor — and pressing jumps there. Leaving the bar without pressing leaves playing where it was.
 *
 * @param position - Where playing has reached, in seconds.
 * @param duration - How long the title is, in seconds.
 * @param scrubAt - Where the cursor has been moved to, while scrubbing.
 * @param trickplay - The title's thumbnails, where it has them.
 * @param onFocus - Told when the remote lands on the bar.
 * @param onBlur - Told when it leaves.
 * @param onPress - Told when the bar is pressed, to jump to the cursor.
 */
const Scrubber = ({
  position,
  duration,
  scrubAt,
  trickplay,
  onFocus,
  onBlur,
  onPress,
}: ScrubberProps) => {
  const shown = scrubAt ?? position;
  const through = duration > 0 ? Math.min(1, Math.max(0, shown / duration)) : 0;
  const played = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

  return (
    <Focusable
      label={say('tv.scrubber.scrub')}
      scale={1}
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={onPress}
    >
      {(isFocused) => {
        const thickness = isFocused ? TRACK_FOCUSED : TRACK;

        return (
          <View style={styles.scrubber}>
            <Text style={styles.time}>{formatDuration(shown)}</Text>

            <View style={styles.along}>
              {scrubAt === null ? null : (
                <View style={[styles.lane, { bottom: THUMB + tokens.space.sm }]}>
                  <View style={{ flex: through }} />
                  <View style={styles.anchor}>
                    <View style={styles.preview}>
                      {trickplay === null ? null : (
                        <TrickplayThumb
                          trickplay={trickplay}
                          seconds={scrubAt}
                          width={PREVIEW_WIDTH}
                        />
                      )}
                      <Text style={styles.previewTime}>{formatDuration(scrubAt)}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 - through }} />
                </View>
              )}

              <View style={[styles.track, { height: thickness, borderRadius: thickness / 2 }]}>
                {scrubAt === null ? (
                  <View style={[styles.gone, { flex: played, borderRadius: thickness / 2 }]} />
                ) : (
                  <>
                    <View
                      style={[
                        styles.gone,
                        { flex: Math.min(played, through), borderRadius: thickness / 2 },
                      ]}
                    />
                    <View
                      style={[
                        styles.ahead,
                        { flex: Math.max(0, through - played), borderRadius: thickness / 2 },
                      ]}
                    />
                  </>
                )}
                <View style={[styles.thumb, isFocused && styles.thumbFocused]} />
                <View style={{ flex: 1 - Math.max(played, through) }} />
              </View>
            </View>

            <Text style={styles.time}>−{formatDuration(Math.max(0, duration - shown))}</Text>
          </View>
        );
      }}
    </Focusable>
  );
};

Scrubber.displayName = 'Scrubber';

const styles = StyleSheet.create({
  scrubber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    paddingVertical: tokens.space.sm,
  },
  time: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontVariant: ['tabular-nums'],
    minWidth: 120,
  },
  along: { flex: 1, justifyContent: 'center' },
  lane: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
  anchor: { width: 0, alignItems: 'center' },
  preview: { width: PREVIEW_WIDTH, alignItems: 'center', gap: tokens.space.xs },
  previewTime: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  gone: { alignSelf: 'stretch', backgroundColor: '#ffffff' },
  ahead: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.6)' },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    marginHorizontal: -THUMB / 2,
    backgroundColor: '#ffffff',
    opacity: 0,
  },
  thumbFocused: { opacity: 1 },
});

export { Scrubber };
