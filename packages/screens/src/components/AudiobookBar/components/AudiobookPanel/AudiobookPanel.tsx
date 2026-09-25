import { useState } from 'react';
import {
  Gauge as GaugeIcon,
  Moon as MoonIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Slider } from '@ValenceUI/Slider';
import { cn } from '@ValenceUI/cn';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { BarButton } from '@ValenceScreens/components/BarButton/BarButton';
import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import { goToChapterBeside } from '@ValenceClient/books/goToChapterBeside';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import type { AudiobookPanelProps } from './AudiobookPanel.types';

/**
 * Says a speed the way the menu lists it.
 *
 * @param speed - How much faster than read it plays.
 * @returns The words, such as "1.25×".
 */
const speedLabel = (speed: number): string => `${speed.toString()}×`;

/**
 * Everything there is to do with the book playing, opened from its bar: how far through the whole
 * book it is, the chapter before and after, how fast it plays, when it should fall asleep, and every
 * chapter to go straight to.
 *
 * Dragging along the book moves the handle and the time with the finger, and the book only goes
 * there when it is let go, so a drag across a track's edge does not fetch every track on the way.
 *
 * @param state - What the player is doing.
 * @param player - The player to drive.
 */
const AudiobookPanel = ({ state, player }: AudiobookPanelProps) => {
  const [scrubbedTo, setScrubbedTo] = useState<number | null>(null);
  const [sleepChoice, setSleepChoice] = useState('off');
  const position = scrubbedTo ?? state.bookPositionSeconds;
  const playing = chapterPlaying(state);
  const sleeping = state.sleep.kind === 'off' ? 'off' : sleepChoice;

  return (
    <div className="flex w-80 max-w-[calc(100vw-3rem)] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Slider
          label="Where the book is"
          value={Math.min(position, state.durationSeconds)}
          max={Math.max(state.durationSeconds, 1)}
          step={1}
          valueLabel={(value) => formatDuration(value)}
          revealsThumb
          className="min-w-0"
          onValueChange={setScrubbedTo}
          onValueCommit={(value) => {
            setScrubbedTo(null);
            player.seek(value);
          }}
        />
        <div className="flex justify-between text-xs tabular-nums text-text-muted">
          <span>{formatDuration(position)}</span>
          <span>-{formatDuration(Math.max(state.durationSeconds - position, 0))}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <BarButton
          label="Previous chapter"
          glyph={SkipBackIcon}
          isDisabled={state.chapters.length === 0}
          onClick={() => {
            goToChapterBeside(player, -1);
          }}
        />

        <div className="flex items-center gap-1">
          <OptionMenu
            label="Speed"
            triggerShape="field"
            className="w-auto"
            trigger={
              <span className="flex items-center gap-1 px-1 text-xs font-semibold tabular-nums">
                <Icon of={GaugeIcon} size={14} />
                {speedLabel(state.speed)}
              </span>
            }
            groups={[
              {
                name: 'Speed',
                selectedId: state.speed.toString(),
                onSelect: (id) => {
                  player.setSpeed(Number(id));
                },
                options: LISTENING_CHOICES.speeds.map((speed) => ({
                  id: speed.toString(),
                  label: speedLabel(speed),
                })),
              },
            ]}
          />

          <OptionMenu
            label="Sleep timer"
            triggerShape="field"
            className="w-auto"
            trigger={
              <span
                className={cn(
                  'flex items-center gap-1 px-1 text-xs font-semibold',
                  sleeping === 'off' ? '' : 'text-text',
                )}
              >
                <Icon of={MoonIcon} size={14} />
                {sleeping === 'off'
                  ? 'Sleep'
                  : sleeping === 'endOfChapter'
                    ? 'End of chapter'
                    : `${sleeping} min`}
              </span>
            }
            groups={[
              {
                name: 'Sleep timer',
                selectedId: sleeping,
                onSelect: (id) => {
                  setSleepChoice(id);
                  player.setSleep(id === 'off' || id === 'endOfChapter' ? id : Number(id));
                },
                options: [
                  { id: 'off', label: 'Off' },
                  ...LISTENING_CHOICES.sleepMinutes.map((minutes) => ({
                    id: minutes.toString(),
                    label: `In ${minutes.toString()} minutes`,
                  })),
                  { id: 'endOfChapter', label: 'At the end of this chapter' },
                ],
              },
            ]}
          />
        </div>

        <BarButton
          label="Next chapter"
          glyph={SkipForwardIcon}
          isDisabled={state.chapters.length === 0 || playing >= state.chapters.length - 1}
          onClick={() => {
            goToChapterBeside(player, 1);
          }}
        />
      </div>

      {state.problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {state.problem}
        </p>
      )}

      <ol aria-label="Chapters" className="flex flex-col gap-0.5">
        {state.chapters.map((chapter, at) => (
          <li key={`${chapter.trackAt.toString()}-${chapter.bookStartSeconds.toString()}`}>
            <Button
              variant="ghost"
              size="sm"
              isActive={at === playing}
              aria-current={at === playing ? 'true' : undefined}
              className="w-full justify-between gap-3 text-left"
              onClick={() => {
                player.goToChapter(at);
              }}
            >
              <span className="truncate">{chapter.title}</span>
              <span className="shrink-0 text-xs tabular-nums text-text-muted">
                {formatDuration(chapter.bookEndSeconds - chapter.bookStartSeconds)}
              </span>
            </Button>
          </li>
        ))}
      </ol>
    </div>
  );
};

AudiobookPanel.displayName = 'AudiobookPanel';

export { AudiobookPanel };
