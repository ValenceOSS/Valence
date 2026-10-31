import { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Layers, MessageSquareLines, Smartphone, Tv } from '@keyline-icons/react-native';
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Stop as StopFilled,
} from '@keyline-icons/react-native/fill';
import { useQuery } from '@tanstack/react-query';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { describePlaybackRate } from '@ValenceClient/playback/describePlaybackRate';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { useVideoRemote } from '@ValenceClient/video/useVideoRemote';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { ATitleLogo } from '@ValenceMobile/components/ATitleLogo/ATitleLogo';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import { AFadingInPicture } from '@ValenceMobile/components/TheVideoRemote/components/AFadingInPicture/AFadingInPicture';
import { ARemoteChoice } from '@ValenceMobile/components/TheVideoRemote/components/ARemoteChoice/ARemoteChoice';
import { TheTelevisionsChoices } from '@ValenceMobile/components/TheVideoRemote/components/TheTelevisionsChoices/TheTelevisionsChoices';
import { asAClock } from '@ValenceMobile/components/Watching/asAClock';
import { ASkipStep } from '@ValenceMobile/components/Watching/components/ASkipStep/ASkipStep';
import { TheSkip } from '@ValenceMobile/components/Watching/components/TheSkip/TheSkip';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { cardTintOf } from '@ValenceMobile/theme/cardTintOf';
import { theColours } from '@ValenceMobile/theme/theColours';
import { ATintedGround } from '@ValenceMobile/components/ATintedGround/ATintedGround';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ASetOfChoices } from '@ValenceMobile/components/Watching/components/TheChoices/TheChoices.types';
import type { VideoSetting } from '@ValenceContracts/schemas/VideoRemote';
import type { VideoRemote } from '@ValenceClient/video/useVideoRemote';
import type { TheVideoRemoteProps } from './TheVideoRemote.types';
import { say } from '@ValenceI18n/say';

const A_STEP = 10;

const HERO_TALL = 1.2;

const POSTER_TALL = 1.5;

const POSTER_LOWERED = 72;

const POSTER_FADE = 72;

const POSTER_BLUR = 90;

const LOGO_HIGH = 96;

const STEP_SIZE = 28;

const UNLIT = 'rgb(20, 20, 22)';

const EASES_OUT: readonly (readonly [number, number])[] = [
  [40, 0],
  [50, 0.06],
  [59, 0.15],
  [67, 0.27],
  [74, 0.41],
  [81, 0.56],
  [87, 0.71],
  [93, 0.86],
  [100, 1],
];

/**
 * How the picture fades down into the colour beneath it: dimmed under the clock, clear to somewhat
 * below its middle, then gone into the ground gradually along an eased curve, in many small steps
 * so no band shows where it begins.
 *
 * @param ground - The colour it fades into.
 * @returns The gradient.
 */
const fadingInto = (ground: string): string =>
  `linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 16%, ${EASES_OUT.map(
    ([at, alpha]) => `${withAlpha(ground, alpha)} ${at.toString()}%`,
  ).join(', ')})`;

const { colours } = PLAYER_LOOK;

type Panel = 'audioAndSubtitles' | 'quality' | 'speed';

type Shown = Pick<VideoRemote, 'device' | 'watching' | 'positionSeconds'> & {
  device: NonNullable<VideoRemote['device']>;
};

const styles = StyleSheet.create({
  action: { flex: 1, maxWidth: '25%' },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  clock: {
    color: colours.quiet,
    fontFamily: FONTS.sans.semibold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  fills: { height: '100%', width: '100%' },
  ground: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  hero: { left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 },
  cannot: { opacity: 0.35 },
  middle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  over: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  said: { alignItems: 'center', gap: 10 },
  skip: { alignItems: 'center' },
  step: { padding: 8 },
  where: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    overflow: 'hidden',
    paddingHorizontal: 14,
  },
  whereRow: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
  whereSaid: { color: colours.text, fontFamily: FONTS.sans.semibold, fontSize: 14 },
  whole: { flex: 1 },
  foot: { flex: 1, gap: 22, justifyContent: 'flex-end', marginBottom: 6 - SCREEN_EDGE },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
});

/**
 * The remote for a television this phone sent a film to or is following, drawn as the phone's own
 * player is over a film, with the film's poster in place of the picture — the one with no lettering
 * on it, since the title's own logo is written below, or its backdrop where the library's catalogue
 * holds no such poster or the server is too old to pick one out. A poster is the shape of the top
 * of a phone, where a backdrop is cut down to a sliver of its middle. The poster keeps its top,
 * where its faces are, and sits a little lower than the top of the screen, clear of the clock and
 * the television's name, over a blurred copy of itself that fills the space above, its top edge
 * fading into the blur. A poster runs on down behind the logo and the controls, whole, fading into
 * the ground only as it nears its foot, so the picture rather than its tint fills the page.
 *
 * The picture runs in from the top, under the clock, fading into a deep shade of the colour along
 * its foot — the card's own tint, which keeps skin and lamplight from turning it brown — held a way
 * down the page and deepening to the dark at its foot, as a card's ground does, with which
 * television it is playing on centred across the top and a stop button in its corner, which stops
 * the film there and puts the remote away, and over its foot the film's own title logo and what it
 * is — the episode, or the year, how long it runs and what kind of film it is. Beneath come the
 * player's own controls: the line through the film with how far in it is and how long is left, the
 * offer to skip the opening or the credits while the television makes it, and five buttons — back a
 * step, ten seconds back, play or pause, ten seconds on and on a step, where a step is an episode
 * on a programme, a chapter in a film that has them, and otherwise back to the start; each greyed
 * out where there is no step to take, as before a programme's first episode or after its last.
 * Last, a row of choices in the player's look — the speed, the sound and subtitles and the quality,
 * each saying what it is set to and opening a sheet of what the television offers, and taking the
 * film back to play on this phone from where it got to, which stops it on the television.
 *
 * When the television moves on to another episode, what is playing slides across to it — in from
 * the right going on, from the left going back — rather than the remote closing and opening again.
 *
 * Once the television stops, or this phone stops being its remote, it goes back down by itself,
 * still showing what was playing as it goes rather than an empty page.
 *
 * A television too old to say what can be chosen offers no choices, and the rest still works.
 *
 * @param onBack - Told somebody is done with it.
 * @param onPlayHere - Told to play the film on this phone, from where the television had reached.
 */
const TheVideoRemote = ({ onBack, onPlayHere }: TheVideoRemoteProps) => {
  const room = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const remote = useVideoRemote();
  const { send, release } = remote;
  const [last, setLast] = useState<Shown | null>(() =>
    remote.device === null
      ? null
      : {
          device: remote.device,
          watching: remote.watching,
          positionSeconds: remote.positionSeconds,
        },
  );
  const hasLeft = useRef(false);
  const leave = useCallback(() => {
    if (hasLeft.current) {
      return;
    }

    hasLeft.current = true;
    onBack();
  }, [onBack]);
  const isStill = usePrefersStillness();
  const [arriving] = useState(() => new Animated.Value(0));
  const towards = useRef<1 | -1>(1);
  const mediaId = (remote.watching ?? last?.watching ?? null)?.mediaId ?? null;
  const [lastMediaId, setLastMediaId] = useState(mediaId);

  useEffect(() => {
    if (mediaId === null || mediaId === lastMediaId) {
      return;
    }

    setLastMediaId(mediaId);

    if (lastMediaId === null || isStill) {
      return;
    }

    arriving.setValue(towards.current);
    Animated.spring(arriving, { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true }).start();
    towards.current = 1;
  }, [mediaId, lastMediaId, isStill, arriving]);

  useEffect(() => {
    if (remote.device !== null) {
      setLast({
        device: remote.device,
        watching: remote.watching,
        positionSeconds: remote.positionSeconds,
      });
    }
  }, [remote.device, remote.watching, remote.positionSeconds]);

  useEffect(() => {
    if (remote.device === null) {
      leave();
    }
  }, [remote.device, leave]);

  const shown =
    remote.device === null
      ? last
      : {
          device: remote.device,
          watching: remote.watching,
          positionSeconds: remote.positionSeconds,
        };
  const watching = shown?.watching ?? null;
  const positionSeconds = shown?.positionSeconds ?? 0;
  const [panel, setPanel] = useState<Panel | null>(null);
  const [shownPanel, setShownPanel] = useState<Panel>('speed');

  if (panel !== null && panel !== shownPanel) {
    setShownPanel(panel);
  }
  const detail = useQuery(libraryQueries.detail(watching?.mediaId ?? null));
  const [hasNoBarePoster, setHasNoBarePoster] = useState<string | null>(null);
  const hasBarePosters = useServerHas('library.barePosters') === true;
  const isPoster = watching !== null && hasBarePosters && hasNoBarePoster !== watching.mediaId;
  const picture =
    watching === null
      ? null
      : onThisServer(
          isPoster
            ? artworkUrl(watching.mediaId, 'poster', { isBare: true })
            : artworkUrl(watching.mediaId, 'backdrop', { size: 'medium' }),
        );
  const heroHeight = Math.round(
    isPoster ? POSTER_LOWERED + width * POSTER_TALL : width * HERO_TALL,
  );
  const hasNoPoster = () => {
    setHasNoBarePoster(watching?.mediaId ?? null);
  };
  const ground = cardTintOf(usePictureLights(picture)) ?? UNLIT;

  if (shown === null) {
    return (
      <Screen onBack={leave} goesBackDown>
        {null}
      </Screen>
    );
  }

  const { device } = shown;

  const isPlaying = watching?.isPlaying ?? false;
  const duration = watching?.durationSeconds ?? 0;
  const title = watching?.title ?? say('common.starting');
  const film = detail.data ?? null;
  const skip = watching?.skip ?? null;
  const facts =
    watching !== null && watching.subtitle !== null
      ? [watching.subtitle]
      : film === null
        ? []
        : [
            film.year === null || film.year === undefined ? null : film.year.toString(),
            howLongItRuns(film.durationSeconds),
            (film.metadata.genres ?? []).length === 0
              ? null
              : (film.metadata.genres ?? []).slice(0, 2).join(', '),
          ].filter((fact) => fact !== null);

  /**
   * One of the television's settings as the player's panels read a set of choices, choosing on the
   * television.
   *
   * @param setting - Which setting.
   * @param heading - What the panel calls it.
   * @returns The set, or nothing where the television does not offer it.
   */
  const setOf = (setting: VideoSetting, heading: string): ASetOfChoices | null => {
    const offered = watching?.settings.find((one) => one.setting === setting);

    return offered === undefined
      ? null
      : {
          heading,
          chosen: offered.chosen,
          choices: offered.choices.map(({ id, label, detail, isDisabled }) => ({
            id,
            label,
            ...(detail === undefined ? {} : { detail }),
            ...(isDisabled === undefined ? {} : { isDisabled }),
          })),
          onChoose: (choiceId) => {
            send({ kind: 'choose', setting, choiceId });
          },
        };
  };

  const audio = setOf('audio', say('common.audio'));
  const subtitles = setOf('subtitles', say('common.subtitles'));
  const quality = setOf('quality', say('common.quality'));
  const speed = setOf('speed', say('common.speed'));
  const canStepOn = watching !== null && (watching.canStepOn || watching.hasNext);
  const canStepBack = watching !== null && (watching.stepsBy === null || watching.canStepBack);
  const stepBackSaid =
    watching?.stepsBy === 'episode'
      ? say('common.previousEpisode')
      : watching?.stepsBy === 'chapter'
        ? say('common.chapterBefore')
        : say('common.startOver');
  const stepOnSaid =
    watching?.stepsBy === 'chapter' ? say('common.nextChapter') : say('common.nextEpisode');
  const qualityOffered = watching?.settings.find((one) => one.setting === 'quality');
  const qualityChosen = qualityOffered?.choices.find(
    (choice) => choice.id === qualityOffered.chosen,
  );
  const qualityNow = qualityChosen?.short ?? qualityChosen?.label;
  const stopChoosing = () => {
    setPanel(null);
  };

  return (
    <View style={styles.whole}>
      <Screen
        onBack={leave}
        goesBackDown
        isSeeThrough
        {...(watching === null
          ? {}
          : {
              corner: (
                <AGlassCircle
                  of={StopFilled}
                  label={say('common.stop')}
                  onPress={() => {
                    send({ kind: 'stop' });
                    leave();
                  }}
                />
              ),
            })}
        behind={
          <>
            <View style={[styles.ground, { backgroundColor: theColours.dark.surface }]} />
            <ATintedGround tint={ground} into={theColours.dark.surface} />
            <View style={[styles.hero, { height: heroHeight }]}>
              <Animated.View
                style={[
                  styles.fills,
                  {
                    opacity: arriving.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [0.3, 1, 0.3],
                    }),
                    transform: [
                      {
                        translateX: arriving.interpolate({
                          inputRange: [-1, 1],
                          outputRange: [-width * 0.15, width * 0.15],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {picture === null ? null : isPoster ? (
                  <>
                    <ARemotePicture
                      style={styles.fills}
                      uri={picture}
                      isTopKept
                      blur={POSTER_BLUR}
                      onMissing={hasNoPoster}
                    />
                    <AFadingInPicture
                      uri={picture}
                      top={POSTER_LOWERED}
                      height={heroHeight - POSTER_LOWERED}
                      fade={POSTER_FADE}
                      onMissing={hasNoPoster}
                    />
                  </>
                ) : (
                  <ARemotePicture style={styles.fills} uri={picture} />
                )}
              </Animated.View>
              <View style={[styles.over, { experimental_backgroundImage: fadingInto(ground) }]} />
            </View>
          </>
        }
      >
        <View style={styles.foot}>
          <Animated.View
            style={[
              styles.said,
              {
                opacity: arriving.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateX: arriving.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-width * 0.4, width * 0.4],
                    }),
                  },
                ],
              },
            ]}
          >
            <ATitleLogo
              mediaId={film?.metadata.hasLogo === true ? film.id : null}
              title={title}
              high={LOGO_HIGH}
              widest={(width - SCREEN_EDGE * 2) * 0.8}
              isOnArtwork
            />
            {facts.length === 0 ? null : (
              <Words size="small" tone="onArtwork" isCentred>
                {facts.join(' · ')}
              </Words>
            )}
          </Animated.View>

          <View>
            <View>
              <Slider
                label={say('common.moveThroughTitle', { title })}
                value={positionSeconds}
                furthest={Math.max(duration, 1)}
                colour={colours.text}
                restColour={colours.rest}
                aheadColour={colours.ahead}
                isDisabled={watching === null}
                onScrubbed={(seconds) => {
                  send({ kind: 'seek', positionSeconds: Math.round(seconds) });
                }}
              />
            </View>
            <View style={styles.times}>
              <Text style={styles.clock}>{asAClock(positionSeconds)}</Text>
              <Text style={styles.clock}>
                {`−${asAClock(Math.max(duration - positionSeconds, 0))}`}
              </Text>
            </View>
          </View>

          {skip === null ? null : (
            <View style={styles.skip}>
              <TheSkip
                says={skip.label}
                isInline
                onSkip={() => {
                  send({ kind: 'seek', positionSeconds: skip.toSeconds });
                }}
              />
            </View>
          )}

          <View style={styles.middle}>
            <Button
              tone="bare"
              label={stepBackSaid}
              isDisabled={!canStepBack}
              onPress={() => {
                towards.current = -1;
                send(
                  watching?.stepsBy === null
                    ? { kind: 'seek', positionSeconds: 0 }
                    : { kind: 'step', toward: 'back' },
                );
              }}
            >
              <View style={[styles.step, !canStepBack && styles.cannot]}>
                <Icon of={SkipBack} size={STEP_SIZE} colour={colours.text} />
              </View>
            </Button>
            <ASkipStep
              by={-A_STEP}
              onSkip={(by) => {
                send({ kind: 'skip', seconds: by });
              }}
            />
            <Button
              tone="bare"
              label={isPlaying ? say('common.pause') : say('common.play')}
              isDisabled={watching === null}
              onPress={() => {
                send({ kind: isPlaying ? 'pause' : 'resume' });
              }}
            >
              <Icon
                of={isPlaying ? Pause : Play}
                size={PLAYER_LOOK.middle + 12}
                colour={colours.text}
              />
            </Button>
            <ASkipStep
              by={A_STEP}
              onSkip={(by) => {
                send({ kind: 'skip', seconds: by });
              }}
            />
            <Button
              tone="bare"
              label={stepOnSaid}
              isDisabled={!canStepOn}
              onPress={() => {
                towards.current = 1;
                send(
                  watching?.stepsBy === null ? { kind: 'next' } : { kind: 'step', toward: 'on' },
                );
              }}
            >
              <View style={[styles.step, !canStepOn && styles.cannot]}>
                <Icon of={SkipForward} size={STEP_SIZE} colour={colours.text} />
              </View>
            </Button>
          </View>

          <View style={styles.actions}>
            {speed === null ? null : (
              <View style={styles.action}>
                <ARemoteChoice
                  icon={Gauge}
                  label={say('common.speed')}
                  value={describePlaybackRate(Number(speed.chosen))}
                  onPress={() => {
                    setPanel('speed');
                  }}
                />
              </View>
            )}
            {audio === null && subtitles === null ? null : (
              <View style={styles.action}>
                <ARemoteChoice
                  icon={MessageSquareLines}
                  label={subtitles === null ? say('common.audio') : say('common.subtitles')}
                  value={
                    (subtitles ?? audio)?.choices.find(
                      (choice) => choice.id === (subtitles ?? audio)?.chosen,
                    )?.label
                  }
                  onPress={() => {
                    setPanel('audioAndSubtitles');
                  }}
                />
              </View>
            )}
            {quality === null ? null : (
              <View style={styles.action}>
                <ARemoteChoice
                  icon={Layers}
                  label={say('common.quality')}
                  value={qualityNow}
                  onPress={() => {
                    setPanel('quality');
                  }}
                />
              </View>
            )}
            {watching === null ? null : (
              <View style={styles.action}>
                <ARemoteChoice
                  icon={Smartphone}
                  label={say('common.playHere')}
                  onPress={() => {
                    send({ kind: 'stop' });
                    release();
                    leave();
                    onPlayHere(watching.mediaId, positionSeconds);
                  }}
                />
              </View>
            )}
          </View>
        </View>
      </Screen>

      <View style={[styles.whereRow, { top: room.top + 4 }]} pointerEvents="none">
        <View style={[styles.where, { maxWidth: width - 128 }]}>
          <AGlass roundness={999} />
          <Icon of={Tv} size={16} colour={colours.text} />
          <Text style={styles.whereSaid} numberOfLines={1}>
            {device.label}
          </Text>
        </View>
      </View>

      <TheTelevisionsChoices
        title={
          shownPanel === 'audioAndSubtitles'
            ? say('phone.watching.audioAndSubtitles')
            : shownPanel === 'quality'
              ? say('common.quality')
              : say('common.speed')
        }
        sets={(shownPanel === 'audioAndSubtitles'
          ? [audio, subtitles]
          : shownPanel === 'quality'
            ? [quality]
            : [speed]
        ).filter((set) => set !== null)}
        isOpen={panel !== null}
        onClose={stopChoosing}
      />
    </View>
  );
};

TheVideoRemote.displayName = 'TheVideoRemote';

export { TheVideoRemote };
