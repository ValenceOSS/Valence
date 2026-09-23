import { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useWindowDimensions,
  View,
} from 'react-native';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Badges } from '@ValenceTv/components/Badges/Badges';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { PreviewBackdrop } from '@ValenceTv/components/PreviewBackdrop/PreviewBackdrop';
import { TitleLockup } from '@ValenceTv/components/TitleLockup/TitleLockup';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TitleSpreadProps } from './TitleSpread.types';

const COLUMN = 760;

const PICTURE_SHARE = 0.68;

const PICTURE_HEIGHT_SHARE = 0.78;

/**
 * A title's own page, laid out as the television's streaming apps lay one out: its picture filling
 * the right of the screen and coming to life with its preview, fading out below and to the left
 * into the glow behind the page, where everything about it is written — its lettering, the year and what it is, the badges for how
 * it looks and sounds, what it is about and who is in it — above a list of what can be done with it.
 *
 * Anything more the title has, such as a programme's seasons, carries on straight beneath the
 * actions, rising into view on the first screen rather than waiting below it. Coming back up onto
 * the actions scrolls the page back to its top, so the title is seen whole again. A title with nothing more sits
 * centred on the screen. The actions catch the
 * remote across the whole width of the page, so pressing up from anywhere beneath lands on them
 * rather than only from what sits straight below.
 *
 * @param mediaId - The title, whose picture, lettering and preview these are, or nothing for one the
 *   library does not have yet, which shows its picture still and its name in words.
 * @param name - What it is called, where it has no logo.
 * @param hasLogo - Whether the server holds its logo.
 * @param stillPath - The picture behind it.
 * @param facts - The year, running time, genres and rating, on one line.
 * @param badges - How it looks and sounds: 4K, Dolby Vision, 5.1.
 * @param tagline - Its line, where it has one.
 * @param overview - What it is about.
 * @param credits - Who is in it and who made it, a line each.
 * @param children - What can be done with it, as action rows.
 * @param below - What carries on beneath.
 */
const TitleSpread = ({
  mediaId,
  name,
  hasLogo,
  stillPath,
  facts,
  badges,
  tagline,
  overview,
  credits,
  children,
  below,
}: TitleSpreadProps) => {
  const screen = useWindowDimensions();
  const page = useRef<ScrollView>(null);
  const picture = {
    width: screen.width * PICTURE_SHARE,
    height: screen.height * PICTURE_HEIGHT_SHARE,
  };

  return (
    <ScrollView ref={page} style={styles.page} showsVerticalScrollIndicator={false}>
      <FadeIn>
        <View
          style={
            below === undefined ? [styles.alone, { minHeight: screen.height }] : styles.withBelow
          }
        >
          <EdgeFade edge="left" reach={0.6} style={[styles.picture, picture]}>
            <EdgeFade edge="bottom" reach={0.45} style={StyleSheet.absoluteFill}>
              {mediaId === null ? (
                <Artwork path={stillPath} style={StyleSheet.absoluteFill} isUrgent />
              ) : (
                <PreviewBackdrop
                  mediaId={mediaId}
                  stillPath={stillPath}
                  isPlaying
                  style={StyleSheet.absoluteFill}
                />
              )}
            </EdgeFade>
          </EdgeFade>

          <View style={styles.column}>
            <TitleLockup mediaId={mediaId} name={name} hasLogo={hasLogo} />

            <View style={styles.factsRow}>
              <Text style={styles.facts}>{facts}</Text>

              <Badges badges={badges} />
            </View>

            {tagline === undefined || tagline === null || tagline === '' ? null : (
              <Text style={styles.tagline}>{tagline}</Text>
            )}

            {overview === undefined || overview === null || overview === '' ? null : (
              <Text numberOfLines={5} style={styles.overview}>
                {overview}
              </Text>
            )}

            {credits.length === 0 ? null : (
              <View style={styles.credits}>
                {credits.map((line) => (
                  <Text key={line} numberOfLines={1} style={styles.credit}>
                    {line}
                  </Text>
                ))}
              </View>
            )}

            <TVFocusGuideView
              autoFocus
              onFocusCapture={() => {
                page.current?.scrollTo({ y: 0, animated: true });
              }}
              style={[styles.actions, { width: screen.width - tokens.space.edge }]}
            >
              {children}
            </TVFocusGuideView>
          </View>
        </View>

        {below}
      </FadeIn>
    </ScrollView>
  );
};

TitleSpread.displayName = 'TitleSpread';

const styles = StyleSheet.create({
  page: { flex: 1 },
  picture: { position: 'absolute', top: 0, right: 0 },
  withBelow: { paddingBottom: tokens.space.lg },
  alone: { justifyContent: 'center', paddingBottom: tokens.space.xl },
  column: {
    width: COLUMN,
    marginLeft: tokens.space.edge,
    paddingTop: tokens.space.xl + tokens.space.lg,
    gap: tokens.space.sm,
  },
  factsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.space.sm },
  facts: { color: tokens.colours.muted, fontSize: tokens.type.small },
  tagline: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '700' },
  overview: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    lineHeight: 34,
    maxWidth: tokens.ACTION_WIDTH,
  },
  credits: { gap: 4, maxWidth: tokens.ACTION_WIDTH },
  credit: { color: tokens.colours.muted, fontSize: tokens.type.small - 2, fontStyle: 'italic' },
  actions: {
    marginTop: tokens.space.md,
    gap: tokens.space.xs,
    alignItems: 'flex-start',
  },
});

export { TitleSpread };
