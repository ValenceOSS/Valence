import { useState } from 'react';
import { BookOpen, Gauge, List, Moon } from '@keyline-icons/react-native';
import {
  FastForward as FastForwardFilled,
  Pause as PauseFilled,
  Play as PlayFilled,
  Rewind as RewindFilled,
  SkipBack as SkipBackFilled,
  SkipForward as SkipForwardFilled,
} from '@keyline-icons/react-native/fill';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { goToChapterBeside } from '@ValenceClient/books/goToChapterBeside';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import { useChapterPlaying } from '@ValenceClient/books/useChapterPlaying';
import { askForASpeed } from '@ValenceMobile/books/askForASpeed';
import { askWhenToSleep } from '@ValenceMobile/books/askWhenToSleep';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import { ALitCircle } from '@ValenceMobile/components/ALitCircle/ALitCircle';
import { AirPlayButton } from '@ValenceMobile/components/AirPlayButton/AirPlayButton';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { AVolumeSlider } from '@ValenceMobile/components/AVolumeSlider/AVolumeSlider';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { TheChapters } from '@ValenceMobile/components/TheListeningPlayer/components/TheChapters/TheChapters';
import { ThePlaceInTheChapter } from '@ValenceMobile/components/TheListeningPlayer/components/ThePlaceInTheChapter/ThePlaceInTheChapter';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheBook } from '@ValenceMobile/hooks/useTheBook';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheListeningPlayerProps } from './TheListeningPlayer.types';

const TALL = 1.5;

const styles = StyleSheet.create({
  controls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cover: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  extras: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around' },
  fills: { height: '100%', width: '100%' },
  floating: {
    alignSelf: 'center',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
  },
  foot: { gap: 14 },
  reach: { padding: 10 },
  said: { gap: 2 },
  top: { flex: 1, gap: 20, justifyContent: 'center' },
});

/**
 * The whole audiobook player, laid out as Apple Books lays its own: the book's cover large, the
 * chapter playing, the book and who wrote it, and at the foot where the chapter has got to and how
 * long is left of the book, the buttons — the chapter before, fifteen seconds back, play, thirty
 * on, the next chapter — the phone's own volume slider, and ways to change the speed, set a sleep
 * timer, send it elsewhere and go straight to any chapter.
 *
 * It is lit in the colours of the cover, as the music player is.
 *
 * @param onBack - Told somebody is done with it.
 */
const TheListeningPlayer = ({ onBack }: TheListeningPlayerProps) => {
  const colours = useTheColours();
  const { width } = useWindowDimensions();
  const { player, state } = useTheBook();
  const at = useChapterPlaying(thePhonesAudiobookPlayer());
  const [topHigh, setTopHigh] = useState(0);
  const [isChoosingChapter, setIsChoosingChapter] = useState(false);
  const { book } = state;
  const cover = book?.hasCover === true ? onThisServer(bookCoverUrl(book.id)) : null;
  const lights = usePictureLights(cover);
  const high = Math.max(Math.min((width - SCREEN_EDGE * 2) * TALL, topHigh - 90), 0);

  if (book === null) {
    return (
      <Screen centres onBack={onBack} goesBackDown>
        <Words tone="muted" isCentred>
          Nothing is playing.
        </Words>
      </Screen>
    );
  }

  const chapter = state.chapters[at];
  const isSleeping = state.sleep.kind !== 'off';
  const isFaster = state.speed !== 1;

  return (
    <Screen onBack={onBack} goesBackDown behind={<AMoodBackground palette={lights} />}>
      <View
        style={styles.top}
        onLayout={({ nativeEvent }) => {
          setTopHigh(nativeEvent.layout.height);
        }}
      >
        {high === 0 ? null : (
          <View
            style={[
              styles.floating,
              { backgroundColor: colours.surfaceRaised, height: high, width: high / TALL },
            ]}
          >
            <View style={[styles.cover, { height: high, width: high / TALL }]}>
              {cover === null ? (
                <Icon of={BookOpen} size={64} colour={colours.textMuted} />
              ) : (
                <Image
                  style={styles.fills}
                  source={{ uri: cover }}
                  accessibilityIgnoresInvertColors
                />
              )}
            </View>
          </View>
        )}

        <View style={styles.said}>
          <Words size="heading" lines={2}>
            {chapter?.title ?? book.title}
          </Words>
          <Words tone="muted" lines={1}>
            {book.authors === null || book.authors.length === 0
              ? book.title
              : `${book.title} · ${book.authors.join(', ')}`}
          </Words>
        </View>
      </View>

      <View style={styles.foot}>
        <ThePlaceInTheChapter title={chapter?.title ?? book.title} />

        <View style={styles.controls}>
          <Button
            tone="bare"
            label="Chapter before"
            onPress={() => {
              goToChapterBeside(player, -1);
            }}
          >
            <View style={styles.reach}>
              <Icon of={SkipBackFilled} size={24} colour={colours.text} />
            </View>
          </Button>

          <Button
            tone="bare"
            label={`Back ${LISTENING_CHOICES.backSeconds.toString()} seconds`}
            onPress={() => {
              player.skip(-LISTENING_CHOICES.backSeconds);
            }}
          >
            <View style={styles.reach}>
              <Icon of={RewindFilled} size={32} colour={colours.text} />
            </View>
          </Button>

          <Button
            tone="bare"
            label={state.isPlaying ? 'Pause' : 'Play'}
            onPress={() => {
              player.toggle();
            }}
          >
            <View style={styles.reach}>
              <Icon
                of={state.isPlaying ? PauseFilled : PlayFilled}
                size={52}
                colour={colours.text}
              />
            </View>
          </Button>

          <Button
            tone="bare"
            label={`On ${LISTENING_CHOICES.forwardSeconds.toString()} seconds`}
            onPress={() => {
              player.skip(LISTENING_CHOICES.forwardSeconds);
            }}
          >
            <View style={styles.reach}>
              <Icon of={FastForwardFilled} size={32} colour={colours.text} />
            </View>
          </Button>

          <Button
            tone="bare"
            label="Next chapter"
            onPress={() => {
              goToChapterBeside(player, 1);
            }}
          >
            <View style={styles.reach}>
              <Icon of={SkipForwardFilled} size={24} colour={colours.text} />
            </View>
          </Button>
        </View>

        <AVolumeSlider />

        <View style={styles.extras}>
          <Button
            tone="bare"
            label={`Speed, ${state.speed.toString()}×`}
            isChosen={isFaster}
            onPress={() => {
              askForASpeed(state.speed, player.setSpeed);
            }}
          >
            <ALitCircle of={Gauge} size={20} isLit={isFaster} />
          </Button>

          <Button
            tone="bare"
            label={isSleeping ? 'Sleep timer, on' : 'Sleep timer'}
            isChosen={isSleeping}
            onPress={() => {
              askWhenToSleep(isSleeping, player.setSleep);
            }}
          >
            <ALitCircle of={Moon} size={20} isLit={isSleeping} />
          </Button>

          <AirPlayButton />

          <Button
            tone="bare"
            label="Chapters"
            isChosen={isChoosingChapter}
            onPress={() => {
              setIsChoosingChapter(true);
            }}
          >
            <ALitCircle of={List} size={20} isLit={isChoosingChapter} />
          </Button>
        </View>

        {isFaster || isSleeping ? (
          <Words size="small" tone="muted" isCentred>
            {[
              isFaster ? `${state.speed.toString()}×` : null,
              state.sleep.kind === 'endOfChapter'
                ? 'Stops at the end of this chapter'
                : isSleeping
                  ? 'Sleep timer on'
                  : null,
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </Words>
        ) : null}

        {state.problem === null ? null : <Words tone="danger">{state.problem}</Words>}

        <TheChapters
          isOpen={isChoosingChapter}
          onClose={() => {
            setIsChoosingChapter(false);
          }}
        />
      </View>
    </Screen>
  );
};

TheListeningPlayer.displayName = 'TheListeningPlayer';

export { TheListeningPlayer };
