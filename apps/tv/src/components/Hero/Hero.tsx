import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TVFocusGuideView, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Info } from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Badges } from '@ValenceTv/components/Badges/Badges';
import { Button } from '@ValenceTv/components/Button/Button';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { PageDots } from '@ValenceTv/components/PageDots/PageDots';
import { PreviewBackdrop } from '@ValenceTv/components/PreviewBackdrop/PreviewBackdrop';
import { TitleLockup } from '@ValenceTv/components/TitleLockup/TitleLockup';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import { say } from '@ValenceI18n/say';
import type { HeroProps } from './Hero.types';

const TAKES_TURNS_MS = 20_000;

const HEIGHT_SHARE = 0.86;

/**
 * The top of the front page: one title filling the screen behind the bar, its preview playing once
 * the page has settled and fading out at its foot into the glow behind the page, with everything
 * needed to decide on it — its lettering, the year and what it is, how it looks and sounds, what it
 * is about (a show's own summary rather than an episode's) — and the two things somebody might do:
 * watch it, or open its page first.
 *
 * A handful of titles take turns, the dots filling as each turn runs, but never while the remote is
 * on the hero's buttons, since the thing somebody is about to press should not change beneath them.
 * Nothing plays while another page covers the front page.
 *
 * Only the picture and the words change with each title. The buttons are made once and stay, their
 * words changing with the title, so the remote is never left on a button that has been thrown away
 * and replaced. Pressing up from them asks the Home tab to take the remote, rather than leaving the
 * television to find it: a guide pinned above a button inside a scrolling page is left behind where
 * the button was once the page has scrolled. The buttons catch the remote across the whole width of
 * the screen, so pressing up from anywhere along the first shelf lands on them.
 *
 * @param items - The titles taking turns.
 * @param progress - How far through each this viewer is.
 * @param isCovered - Whether another page is over the front page.
 * @param onPlay - Told to play a title, and from where.
 * @param onInspect - Told to open a title's page.
 * @param onFeature - Told which title is showing, so the page can take on its colours.
 * @param upTo - The tab along the top the front page belongs to, which pressing up from the buttons
 *   goes to.
 * @param onReached - Told when the remote comes onto the buttons, so the page can scroll back to the
 *   top and show the hero whole.
 * @param playRef - Handed the Play button, which pressing down from the bar goes to.
 */
const Hero = ({
  items,
  progress,
  isCovered,
  onPlay,
  onInspect,
  onFeature,
  upTo,
  onReached,
  playRef,
}: HeroProps) => {
  const screen = useWindowDimensions();
  const [turn, setTurn] = useState(0);
  const [isHeld, setIsHeld] = useState(false);
  const featuring = useRef(onFeature);
  const media = items[turn % Math.max(items.length, 1)] ?? null;
  const detail = useQuery(libraryQueries.detail(media?.id ?? null));
  const showId = media === null ? null : showIdOf(media);
  const show = useQuery(
    libraryQueries.show(showId === null ? null : (media?.libraryId ?? null), showId),
  );

  useEffect(() => {
    featuring.current = onFeature;
  });

  const upToBar = useHandOff('up', upTo);

  useEffect(() => {
    if (media !== null) {
      featuring.current?.(media);
    }
  }, [media]);

  if (media === null) {
    return null;
  }

  const resume = resumeFor(progress, media.id);
  const isSeries = typeof media.seriesTitle === 'string';
  const overview = isSeries
    ? (show.data?.overview ?? null)
    : (detail.data?.metadata.overview ?? null);

  return (
    <View style={{ height: screen.height * HEIGHT_SHARE }}>
      <View style={StyleSheet.absoluteFill}>
        <FadeIn key={media.id}>
          <EdgeFade edge="bottom" reach={0.5} style={StyleSheet.absoluteFill}>
            <PreviewBackdrop
              mediaId={media.id}
              stillPath={media.hasBackdrop ? artworkUrl(media.id, 'backdrop') : null}
              isPlaying={!isCovered}
              style={StyleSheet.absoluteFill}
            />

            <LinearGradient
              colors={[withAlpha(tokens.colours.canvas, 0.85), withAlpha(tokens.colours.canvas, 0)]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0.65, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </EdgeFade>
        </FadeIn>
      </View>

      <View style={styles.words}>
        <FadeIn key={media.id} isFilling={false}>
          <View style={styles.about}>
            <TitleLockup
              mediaId={media.id}
              name={media.seriesTitle ?? media.title}
              hasLogo={media.hasLogo}
            />

            <View style={styles.factsRow}>
              <Text style={styles.facts}>
                {joinFacts([
                  typeof media.rating === 'number' ? `★ ${media.rating.toFixed(1)}` : null,
                  media.year?.toString(),
                  isSeries ? say('tv.hero.series') : formatDuration(media.durationSeconds),
                  media.genres?.slice(0, 2).join(', '),
                ])}
              </Text>

              <Badges
                badges={
                  detail.data === undefined || detail.data === null
                    ? []
                    : qualityBadges(detail.data)
                }
              />
            </View>

            {overview === null ? null : (
              <Text numberOfLines={3} style={styles.overview}>
                {overview}
              </Text>
            )}
          </View>
        </FadeIn>

        <TVFocusGuideView
          autoFocus
          style={[styles.actions, { width: screen.width - tokens.space.edge }]}
        >
          <Button
            ref={playRef}
            label={
              resume === null
                ? say('tv.hero.play')
                : say('tv.hero.resume', { when: formatDuration(resume) })
            }
            icon={Play}
            variant="confirm"
            onFocus={() => {
              setIsHeld(true);
              upToBar.arrive();
              onReached?.();
            }}
            onBlur={() => {
              setIsHeld(false);
              upToBar.leave();
            }}
            onPress={() => {
              onPlay(media, resume ?? 0);
            }}
          />
          <Button
            label={say('tv.hero.moreInfo')}
            icon={Info}
            variant="overlay"
            onFocus={() => {
              setIsHeld(true);
              upToBar.arrive();
              onReached?.();
            }}
            onBlur={() => {
              setIsHeld(false);
              upToBar.leave();
            }}
            onPress={() => {
              onInspect(media);
            }}
          />
        </TVFocusGuideView>
      </View>

      {items.length > 1 ? (
        <View style={styles.dots}>
          <PageDots
            count={items.length}
            current={turn % items.length}
            turnMs={TAKES_TURNS_MS}
            isRunning={!isHeld && !isCovered}
            onTurnDone={() => {
              setTurn((was) => was + 1);
            }}
          />
        </View>
      ) : null}
    </View>
  );
};

Hero.displayName = 'Hero';

const styles = StyleSheet.create({
  words: {
    position: 'absolute',
    left: tokens.space.edge,
    bottom: tokens.space.xl + tokens.space.lg,
    width: 1000,
    gap: tokens.space.sm,
  },
  about: { gap: tokens.space.sm },
  factsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.space.sm },
  facts: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '500' },
  overview: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    lineHeight: 34,
    maxWidth: 900,
  },
  actions: { flexDirection: 'row', gap: tokens.space.md, marginTop: tokens.space.sm },
  dots: {
    position: 'absolute',
    right: tokens.space.edge,
    bottom: tokens.space.xl + tokens.space.lg,
  },
});

export { Hero };
