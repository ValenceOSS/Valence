import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { ChevronLeft, Gauge, List, Moon } from '@keyline-icons/react-native';
import {
  FastForward,
  Gauge as GaugeFilled,
  Moon as MoonFilled,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
} from '@keyline-icons/react-native/fill';
import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import { describeLength } from '@ValenceClient/books/describeLength';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { goToChapterBeside } from '@ValenceClient/books/goToChapterBeside';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { useAudiobookPlayer } from '@ValenceClient/books/useAudiobookPlayer';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Button } from '@ValenceTv/components/Button/Button';
import { ChoicePanel } from '@ValenceTv/components/ChoicePanel/ChoicePanel';
import { CoverGlow } from '@ValenceTv/components/CoverGlow/CoverGlow';
import { FocusFence } from '@ValenceTv/components/FocusFence/FocusFence';
import { Scrubber } from '@ValenceTv/components/Scrubber/Scrubber';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { tokens } from '@ValenceTv/theme/tokens';
import type { AudiobookPlayerState } from '@ValenceClient/books/createAudiobookPlayer';
import type { Choice } from '@ValenceTv/components/ChoicePanel/ChoicePanel.types';
import type { ListeningPanel, ListeningProps } from './Listening.types';

const COVER = { width: 400, height: 600 };

const CONTROLS = 820;

const BACK_ROOM = 110;

const SLEEP_TICKS_MS = 15_000;

/**
 * Says how fast a book plays, the way the speeds are listed.
 *
 * @param speed - How much faster than read it plays.
 * @returns The words, such as "1.25×".
 */
const speedLabel = (speed: number): string => `${speed.toString()}×`;

/**
 * Says when the sleep timer will stop the book, where it is set.
 *
 * @param state - What the player is doing.
 * @param now - The time now, in milliseconds.
 * @returns The words, or nothing where it is not set.
 */
const sleepLabel = ({ sleep }: AudiobookPlayerState, now: number): string | null => {
  if (sleep.kind === 'off') {
    return null;
  }

  return sleep.kind === 'endOfChapter'
    ? 'End of chapter'
    : `${Math.max(Math.ceil((sleep.endsAtMs - now) / 60_000), 1).toString()} min`;
};

/**
 * The choices each of the player's panels lists.
 *
 * @param panel - Which panel.
 * @param state - What the player is doing.
 * @returns What there is to choose from.
 */
const choicesFor = (panel: ListeningPanel, state: AudiobookPlayerState): Choice[] => {
  if (panel === 'speed') {
    return LISTENING_CHOICES.speeds.map((speed) => ({
      id: speed.toString(),
      label: speedLabel(speed),
      isCurrent: speed === state.speed,
    }));
  }

  if (panel === 'sleep') {
    return [
      { id: 'off', label: 'Off', isCurrent: state.sleep.kind === 'off' },
      ...LISTENING_CHOICES.sleepMinutes.map((minutes) => ({
        id: minutes.toString(),
        label: `${minutes.toString()} minutes`,
        isCurrent: false,
      })),
      {
        id: 'endOfChapter',
        label: 'End of this chapter',
        isCurrent: state.sleep.kind === 'endOfChapter',
      },
    ];
  }

  const at = chapterPlaying(state);

  return state.chapters.map((chapter, index) => ({
    id: index.toString(),
    label: chapter.title,
    detail: formatDuration(chapter.bookEndSeconds - chapter.bookStartSeconds),
    isCurrent: index === at,
  }));
};

const TITLES: Record<ListeningPanel, string> = {
  speed: 'Speed',
  sleep: 'Sleep timer',
  chapters: 'Chapters',
};

/**
 * The book playing, filling the screen as the television's music player does: the whole screen lit
 * by its cover, the cover itself beside the chapter playing, the book and who wrote it, how far
 * through the chapter it is and how long is left of the book, and the controls — the chapter
 * before, back fifteen seconds, play, on thirty, the next chapter — and beneath them how fast it
 * plays, a sleep timer and every chapter to go straight to.
 *
 * Menu closes whichever panel is open, and otherwise goes back to wherever this was opened from, the
 * book carrying on, as does the Back button at the top left, which pressing up from the bar reaches
 * though it sits away to the left.
 *
 * @param onEmpty - Told when no book is open any more, to close the screen.
 * @param onBack - Told when the button at the top left is pressed, to go back as Menu does.
 */
const Listening = ({ onEmpty, onBack }: ListeningProps) => {
  const { state, player } = useAudiobookPlayer(theAudiobookPlayer(), { followsPosition: true });
  const [panel, setPanel] = useState<ListeningPanel | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [backButton, setBackButton] = useState<View | null>(null);
  const upToBack = useHandOff('up', backButton);
  const { book, sleep } = state;

  useEffect(() => {
    if (sleep.kind !== 'after') {
      return;
    }

    setNow(Date.now());

    const ticking = setInterval(() => {
      setNow(Date.now());
    }, SLEEP_TICKS_MS);

    return () => {
      clearInterval(ticking);
    };
  }, [sleep]);

  useEffect(() => {
    if (book === null) {
      onEmpty();
    }
  }, [book, onEmpty]);

  const closePanel = useCallback(() => {
    setPanel(null);
  }, []);

  useMenuButton(panel === null ? null : closePanel, true);

  if (book === null) {
    return <View style={styles.screen} />;
  }

  const at = chapterPlaying(state);
  const chapter = state.chapters[at];
  const chapterStart = chapter?.bookStartSeconds ?? 0;
  const chapterLength = (chapter?.bookEndSeconds ?? state.durationSeconds) - chapterStart;
  const left = (state.durationSeconds - state.bookPositionSeconds) / state.speed;
  const cover = book.hasCover ? bookCoverUrl(book.id) : null;
  const sleeping = sleepLabel(state, now);

  const choose = (id: string): void => {
    if (panel === 'speed') {
      player.setSpeed(Number(id));
    } else if (panel === 'sleep') {
      player.setSleep(id === 'off' || id === 'endOfChapter' ? id : Number(id));
    } else {
      player.goToChapter(Number(id));
    }

    closePanel();
  };

  return (
    <View style={styles.screen}>
      <CoverGlow path={cover} />

      <FocusFence isShut={panel !== null} style={styles.stage}>
        <View style={styles.back}>
          <Button
            ref={setBackButton}
            label="Back"
            icon={ChevronLeft}
            variant="overlay"
            size="md"
            isPill
            onFocus={upToBack.leave}
            onPress={onBack}
          />
        </View>

        <View style={styles.spread}>
          <View style={[styles.lifted, COVER]}>
            <View style={styles.cover}>
              {cover === null ? (
                <Text numberOfLines={4} style={styles.titled}>
                  {book.title}
                </Text>
              ) : (
                <Artwork path={cover} isUrgent style={StyleSheet.absoluteFill} />
              )}
            </View>
          </View>

          <TVFocusGuideView autoFocus style={[styles.side, { width: CONTROLS }]}>
            <View style={styles.names}>
              <Text numberOfLines={2} style={styles.chapter}>
                {chapter?.title ?? book.title}
              </Text>
              <Text numberOfLines={1} style={styles.book}>
                {book.title}
                {book.authors === null || book.authors.length === 0
                  ? ''
                  : ` — ${book.authors.join(', ')}`}
              </Text>
            </View>

            <Scrubber
              onFocus={upToBack.arrive}
              position={state.bookPositionSeconds - chapterStart}
              duration={chapterLength}
              onSeek={(seconds) => {
                player.seek(chapterStart + seconds);
              }}
            />

            <Text style={styles.left}>
              {state.problem ?? `${describeLength(left)} left in the book`}
            </Text>

            <View style={styles.transport}>
              <Button
                onFocus={upToBack.leave}
                label="Chapter before"
                icon={SkipBack}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={() => {
                  goToChapterBeside(player, -1);
                }}
              />
              <Button
                onFocus={upToBack.leave}
                label={`Back ${LISTENING_CHOICES.backSeconds.toString()} seconds`}
                icon={Rewind}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={() => {
                  player.skip(-LISTENING_CHOICES.backSeconds);
                }}
              />
              <Button
                onFocus={upToBack.leave}
                label={state.isPlaying ? 'Pause' : 'Play'}
                icon={state.isPlaying ? Pause : Play}
                variant="ghost"
                size="xl"
                isIconOnly
                iconSize={64}
                hasPreferredFocus
                onPress={player.toggle}
              />
              <Button
                onFocus={upToBack.leave}
                label={`On ${LISTENING_CHOICES.forwardSeconds.toString()} seconds`}
                icon={FastForward}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={() => {
                  player.skip(LISTENING_CHOICES.forwardSeconds);
                }}
              />
              <Button
                onFocus={upToBack.leave}
                label="Next chapter"
                icon={SkipForward}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={() => {
                  goToChapterBeside(player, 1);
                }}
              />
            </View>

            <View style={styles.extras}>
              <Button
                onFocus={upToBack.leave}
                label={speedLabel(state.speed)}
                icon={state.speed === 1 ? Gauge : GaugeFilled}
                variant={state.speed === 1 ? 'ghost' : 'soft'}
                size="md"
                onPress={() => {
                  setPanel('speed');
                }}
              />
              <Button
                onFocus={upToBack.leave}
                label={sleeping ?? 'Sleep timer'}
                icon={sleeping === null ? Moon : MoonFilled}
                variant={sleeping === null ? 'ghost' : 'soft'}
                size="md"
                onPress={() => {
                  setPanel('sleep');
                }}
              />
              <Button
                onFocus={upToBack.leave}
                label="Chapters"
                icon={List}
                variant="ghost"
                size="md"
                onPress={() => {
                  setPanel('chapters');
                }}
              />
            </View>
          </TVFocusGuideView>
        </View>
      </FocusFence>

      {panel === null ? null : (
        <ChoicePanel title={TITLES[panel]} choices={choicesFor(panel, state)} onChoose={choose} />
      )}
    </View>
  );
};

Listening.displayName = 'Listening';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.colours.canvas },
  stage: { flex: 1, paddingTop: BACK_ROOM, paddingHorizontal: tokens.space.edge },
  back: { position: 'absolute', top: tokens.space.lg, left: tokens.space.edge, zIndex: 1 },
  spread: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.xl * 1.5,
  },
  lifted: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
  cover: {
    flex: 1,
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
    justifyContent: 'flex-end',
    padding: tokens.space.md,
  },
  titled: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '800' },
  side: { gap: tokens.space.md },
  names: { gap: tokens.space.xs },
  chapter: { color: '#ffffff', fontSize: tokens.type.heading + 4, fontWeight: '800' },
  book: { color: 'rgba(255,255,255,0.75)', fontSize: tokens.type.body },
  left: { color: 'rgba(255,255,255,0.6)', fontSize: tokens.type.small },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  extras: { flexDirection: 'row', justifyContent: 'center', gap: tokens.space.md },
});

export { Listening };
