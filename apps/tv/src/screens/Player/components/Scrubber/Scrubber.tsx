import { StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { chapterAt } from '@ValenceClient/playback/chapterAt';
import { nameOfChapter } from '@ValenceClient/playback/nameOfChapter';
import { timelineMarks } from '@ValenceClient/playback/timelineMarks';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { TrickplayThumb } from '@ValenceTv/screens/Player/components/TrickplayThumb/TrickplayThumb';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ScrubberProps } from './Scrubber.types';
import { say } from '@ValenceI18n/say';

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
 * @param segments - The intro, recap and credits, shaded along the bar.
 * @param chapters - The chapters the file marks, broken out along the bar and named above the
 *   cursor.
 * @param onFocus - Told when the remote lands on the bar.
 * @param onBlur - Told when it leaves.
 * @param onPress - Told when the bar is pressed, to jump to the cursor.
 */
const Scrubber = ({
  position,
  duration,
  scrubAt,
  trickplay,
  segments = [],
  chapters = [],
  onFocus,
  onBlur,
  onPress,
}: ScrubberProps) => {
  const shown = scrubAt ?? position;
  const through = duration > 0 ? Math.min(1, Math.max(0, shown / duration)) : 0;
  const played = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const marks = timelineMarks(segments, chapters, duration);
  const scrubbedChapter = scrubAt === null ? null : chapterAt(chapters, scrubAt);

  return (
    <Focusable
      label={say('tv.player.scrubber.scrub')}
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
                      {scrubbedChapter === null ? null : (
                        <Text numberOfLines={1} style={styles.previewChapter}>
                          {nameOfChapter(scrubbedChapter.chapter, scrubbedChapter.number)}
                        </Text>
                      )}
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
                {marks.stretches.map((stretch) => (
                  <View
                    key={`${stretch.from.toString()}-${stretch.to.toString()}`}
                    pointerEvents="none"
                    style={styles.overlay}
                  >
                    <View style={{ flex: stretch.from }} />
                    <View
                      testID="scrubber-stretch"
                      style={[styles.stretch, { flex: stretch.to - stretch.from }]}
                    />
                    <View style={{ flex: 1 - stretch.to }} />
                  </View>
                ))}
                {marks.notches.map((notch) => (
                  <View key={notch} pointerEvents="none" style={styles.overlay}>
                    <View style={{ flex: notch }} />
                    <View testID="scrubber-notch" style={styles.notch} />
                    <View style={{ flex: 1 - notch }} />
                  </View>
                ))}
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
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row' },
  stretch: { alignSelf: 'stretch', backgroundColor: '#f5d589' },
  notch: {
    alignSelf: 'stretch',
    width: 3,
    marginHorizontal: -1.5,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  previewChapter: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '600',
    maxWidth: PREVIEW_WIDTH,
  },
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
