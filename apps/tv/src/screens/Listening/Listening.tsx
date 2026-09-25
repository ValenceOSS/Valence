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
import { chooseListening } from '@ValenceClient/books/chooseListening';
import { describeLength } from '@ValenceClient/books/describeLength';
import { describeSpeed } from '@ValenceClient/books/describeSpeed';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { goToChapterBeside } from '@ValenceClient/books/goToChapterBeside';
import { listeningChoices } from '@ValenceClient/books/listeningChoices';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { useAudiobookPlayer } from '@ValenceClient/books/useAudiobookPlayer';
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
import type { ListeningPanel } from '@ValenceClient/books/listeningChoices';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import { sayCount } from '@ValenceI18n/sayCount';
import type { ListeningProps } from './Listening.types';

const COVER = { width: 400, height: 600 };

const CONTROLS = 820;

const BACK_ROOM = 110;

const SLEEP_TICKS_MS = 15_000;

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
    ? say('tv.listening.endOfChapter')
    : say('tv.listening.sleepMinutes', {
        minutes: Math.max(Math.ceil((sleep.endsAtMs - now) / 60_000), 1),
      });
};

const TITLES: Record<ListeningPanel, StringKey> = {
  speed: 'tv.listening.speed',
  sleep: 'tv.listening.sleepTimer',
  chapters: 'tv.listening.chapters',
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
 * though it sits away to the left, and pressing down from it goes back to the bar.
 *
 * @param onEmpty - Told when no book is open any more, to close the screen.
 * @param onBack - Told when the button at the top left is pressed, to go back as Menu does.
 */
const Listening = ({ onEmpty, onBack }: ListeningProps) => {
  const { state, player } = useAudiobookPlayer(theAudiobookPlayer(), { followsPosition: true });
  const [panel, setPanel] = useState<ListeningPanel | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [backButton, setBackButton] = useState<View | null>(null);
  const [bar, setBar] = useState<View | null>(null);
  const upToBack = useHandOff('up', backButton);
  const downFromBack = useHandOff('down', bar);

  const atTheBack = useCallback(() => {
    upToBack.leave();
    downFromBack.arrive();
  }, [upToBack, downFromBack]);

  const atTheBar = useCallback(() => {
    upToBack.arrive();
    downFromBack.leave();
  }, [upToBack, downFromBack]);

  const awayFromTheEdges = useCallback(() => {
    upToBack.leave();
    downFromBack.leave();
  }, [upToBack, downFromBack]);
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
    if (panel !== null) {
      chooseListening(player, panel, id);
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
            label={say('common.back')}
            icon={ChevronLeft}
            variant="overlay"
            size="md"
            isPill
            onFocus={atTheBack}
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
                {book.authors === null || book.authors.length === 0
                  ? book.title
                  : say('tv.listening.bookBy', {
                      title: book.title,
                      authors: book.authors.join(', '),
                    })}
              </Text>
            </View>

            <Scrubber
              ref={setBar}
              onFocus={atTheBar}
              position={state.bookPositionSeconds - chapterStart}
              duration={chapterLength}
              onSeek={(seconds) => {
                player.seek(chapterStart + seconds);
              }}
            />

            <Text style={styles.left}>
              {state.problem ?? say('tv.listening.leftInTheBook', { length: describeLength(left) })}
            </Text>

            <View style={styles.transport}>
              <Button
                onFocus={awayFromTheEdges}
                label={say('tv.listening.chapterBefore')}
                icon={SkipBack}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={() => {
                  goToChapterBeside(player, -1);
                }}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={sayCount('tv.listening.backSeconds', LISTENING_CHOICES.backSeconds)}
                icon={Rewind}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={() => {
                  player.skip(-LISTENING_CHOICES.backSeconds);
                }}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={state.isPlaying ? say('tv.listening.pause') : say('tv.listening.play')}
                icon={state.isPlaying ? Pause : Play}
                variant="ghost"
                size="xl"
                isIconOnly
                iconSize={64}
                hasPreferredFocus
                onPress={player.toggle}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={sayCount('tv.listening.onSeconds', LISTENING_CHOICES.forwardSeconds)}
                icon={FastForward}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={() => {
                  player.skip(LISTENING_CHOICES.forwardSeconds);
                }}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={say('tv.listening.nextChapter')}
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
                onFocus={awayFromTheEdges}
                label={describeSpeed(state.speed)}
                icon={state.speed === 1 ? Gauge : GaugeFilled}
                variant={state.speed === 1 ? 'ghost' : 'soft'}
                size="md"
                onPress={() => {
                  setPanel('speed');
                }}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={sleeping ?? say('tv.listening.sleepTimer')}
                icon={sleeping === null ? Moon : MoonFilled}
                variant={sleeping === null ? 'ghost' : 'soft'}
                size="md"
                onPress={() => {
                  setPanel('sleep');
                }}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={say('tv.listening.chapters')}
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
        <ChoicePanel
          title={say(TITLES[panel])}
          choices={listeningChoices(panel, state)}
          onChoose={choose}
        />
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
