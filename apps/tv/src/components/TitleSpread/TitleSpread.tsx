import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badges } from '@ValenceTv/components/Badges/Badges';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { PreviewBackdrop } from '@ValenceTv/components/PreviewBackdrop/PreviewBackdrop';
import { TitleLockup } from '@ValenceTv/components/TitleLockup/TitleLockup';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import type { TitleSpreadProps } from './TitleSpread.types';

const COLUMN = 760;

const PICTURE_SHARE = 0.68;

const PICTURE_HEIGHT_SHARE = 0.78;

/**
 * A title's own page, laid out as the television's streaming apps lay one out: its picture filling
 * the right of the screen and coming to life with its preview, fading into the page on the left
 * where everything about it is written — its lettering, the year and what it is, the badges for how
 * it looks and sounds, what it is about and who is in it — above a list of what can be done with it.
 *
 * Anything more the title has, such as a programme's seasons, carries on straight beneath the
 * actions, rising into view on the first screen rather than waiting below it.
 *
 * @param mediaId - The title, whose picture, lettering and preview these are.
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
  const picture = {
    width: screen.width * PICTURE_SHARE,
    height: screen.height * PICTURE_HEIGHT_SHARE,
  };

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
      <FadeIn>
        <View style={below === undefined ? { minHeight: screen.height } : styles.withBelow}>
          <View style={[styles.picture, picture]}>
            <PreviewBackdrop
              mediaId={mediaId}
              stillPath={stillPath}
              isPlaying
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[
                tokens.colours.canvas,
                withAlpha(tokens.colours.canvas, 0.6),
                withAlpha(tokens.colours.canvas, 0),
              ]}
              locations={[0, 0.3, 0.6]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[withAlpha(tokens.colours.canvas, 0), tokens.colours.canvas]}
              start={{ x: 0.5, y: 0.55 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

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

            <View style={styles.actions}>{children}</View>
          </View>
        </View>

        {below}
      </FadeIn>
    </ScrollView>
  );
};

TitleSpread.displayName = 'TitleSpread';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tokens.colours.canvas },
  picture: { position: 'absolute', top: 0, right: 0 },
  withBelow: { paddingBottom: tokens.space.lg },
  column: {
    width: COLUMN,
    marginLeft: tokens.space.edge,
    paddingTop: tokens.space.xl + tokens.space.lg,
    gap: tokens.space.sm,
  },
  factsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.space.sm },
  facts: { color: tokens.colours.muted, fontSize: tokens.type.small },
  tagline: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '700' },
  overview: { color: tokens.colours.text, fontSize: tokens.type.small, lineHeight: 34 },
  credits: { gap: 4 },
  credit: { color: tokens.colours.muted, fontSize: tokens.type.small - 2, fontStyle: 'italic' },
  actions: { marginTop: tokens.space.md, marginLeft: -tokens.space.md, gap: tokens.space.xs },
});

export { TitleSpread };
