import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeEncodeProgress } from '@ValenceClient/admin/describeEncodeProgress';
import { describeReencodeState } from '@ValenceClient/admin/describeReencodeState';
import { runPreTranscodingNow } from '@ValenceClient/admin/runPreTranscodingNow';
import { savePreTranscoding } from '@ValenceClient/admin/savePreTranscoding';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import {
  DEFAULT_PRE_TRANSCODE_TARGET,
  MOST_PRE_TRANSCODE_TARGETS,
  PRE_TRANSCODE_QUALITIES,
  PRE_TRANSCODING_DEFAULTS,
} from '@ValenceContracts/schemas/PreTranscoding';
import { failureOfAnswer, failureOfMissing } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { LibraryPicker } from '@ValenceScreens/components/AdminArea/components/LibraryPicker/LibraryPicker';
import { StatStrip } from '@ValenceScreens/components/AdminArea/components/StatStrip/StatStrip';
import { describeHour } from './describeHour';
import { LadderRung } from './components/LadderRung/LadderRung';
import { readBitrate } from '@ValenceScreens/admin/readBitrate';
import type {
  PreTranscodeTarget,
  PreTranscodingSettings,
} from '@ValenceContracts/schemas/PreTranscoding';
import type { PreTranscodingCardProps } from './PreTranscodingCard.types';
import { say } from '@ValenceI18n/say';

const HOUR_CHOICES = Array.from({ length: 24 }, (_, hour) => ({
  id: hour.toString(),
  label: describeHour(hour),
}));

const SCHEDULE_CHOICES = [
  { id: 'window', label: say('screens.adminArea.preTranscodingCard.inQuietHours') },
  { id: 'untilDone', label: say('screens.adminArea.preTranscodingCard.untilEverythingIsDone') },
] as const;

const VIDEO_LIBRARY_KINDS: readonly string[] = ['movies', 'shows', 'anime'];

/**
 * The rung a ladder gains next: one step below its lowest, made the way that rung is made, or the
 * lowest step there is where the ladder already reaches it.
 *
 * @param targets - The ladder so far.
 * @returns The rung to add.
 */
const rungBelow = (targets: readonly PreTranscodeTarget[]): PreTranscodeTarget => {
  const lowest = targets.reduce(
    (at, target) => Math.max(at, PRE_TRANSCODE_QUALITIES.indexOf(target.quality)),
    -1,
  );
  const below = PRE_TRANSCODE_QUALITIES[Math.min(lowest + 1, PRE_TRANSCODE_QUALITIES.length - 1)];
  const like = targets.at(-1) ?? DEFAULT_PRE_TRANSCODE_TARGET;

  return { ...like, quality: below ?? like.quality, maxBitrateKbps: null };
};

/**
 * The ceiling a rung's field shows, which is empty where it has none.
 *
 * @param target - The rung.
 * @returns The ceiling as text.
 */
const bitrateText = (target: PreTranscodeTarget): string =>
  target.maxBitrateKbps === null ? '' : target.maxBitrateKbps.toString();

/**
 * Pre-transcoding, where it is set up and watched: a ladder of copies of each film and episode kept
 * beside it, one at every rung chosen, so a modest device or a slow connection has one it plays
 * without the server converting anything, made in the hours chosen. Shows how far each rung has got
 * and the copy being made now, lets it be paused or asked to make the next copy at once, and saves
 * what is changed only when asked to.
 *
 * @param libraries - Every library, of which only those holding films or episodes are offered.
 */
const PreTranscodingCard = ({ libraries }: PreTranscodingCardProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.preTranscoding());
  const saved = asked.data?.settings ?? PRE_TRANSCODING_DEFAULTS;
  const [draft, setDraft] = useState<PreTranscodingSettings>(saved);
  const [bitrates, setBitrates] = useState<string[]>(saved.targets.map(bitrateText));
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    if (isEdited) {
      return;
    }

    setDraft(saved);
    setBitrates(saved.targets.map(bitrateText));
  }, [saved, isEdited]);

  const videoLibraries = useMemo(
    () => libraries.filter((one) => VIDEO_LIBRARY_KINDS.includes(one.kind)),
    [libraries],
  );

  const readings = bitrates.map(readBitrate);
  const hasInvalidBitrate = readings.some((reading) => reading.kind === 'invalid');
  const chosen: PreTranscodingSettings = {
    ...draft,
    isPaused: saved.isPaused,
    targets: draft.targets.map((target, index) => {
      const reading = readings[index];

      return { ...target, maxBitrateKbps: reading?.kind === 'kbps' ? reading.kbps : null };
    }),
  };
  const isChanged = JSON.stringify(chosen) !== JSON.stringify(saved);
  const compressesAudio = draft.targets.every((target) => target.audio === 'compress');

  const change = (patch: Partial<PreTranscodingSettings>) => {
    setIsEdited(true);
    setDraft((before) => ({ ...before, ...patch }));
  };

  const changeRung = (at: number, patch: Partial<PreTranscodeTarget>) => {
    change({
      targets: draft.targets.map((target, index) =>
        index === at ? { ...target, ...patch } : target,
      ),
    });
  };

  const store = async (next: PreTranscodingSettings, done: string): Promise<boolean> => {
    setIsSaving(true);

    const answer = await savePreTranscoding(next);

    setIsSaving(false);

    if (tellOutcome(done, failureOfMissing(answer)) && answer !== null) {
      cache.setQueryData(adminQueries.preTranscoding().queryKey, answer);
      void cache.invalidateQueries({ queryKey: adminQueries.reencodes().queryKey });

      return true;
    }

    return false;
  };

  const runNow = async () => {
    setIsRunning(true);

    const isQueued = await runPreTranscodingNow();

    setIsRunning(false);
    tellOutcome(
      say('screens.adminArea.preTranscodingCard.theNextCopyIsBeingMade'),
      failureOfAnswer(isQueued, say('screens.adminArea.preTranscodingCard.thereIsNothingToMakeA')),
    );
    void cache.invalidateQueries({ queryKey: adminQueries.preTranscoding().queryKey });
    void cache.invalidateQueries({ queryKey: adminQueries.reencodes().queryKey });
  };

  const status = asked.data;
  const current = status?.current ?? null;

  if (asked.isError) {
    return (
      <PanelCard title={say('common.preTranscoding')}>
        <p className="text-sm text-text-muted">
          {say('screens.adminArea.preTranscodingCard.preTranscodingCouldNotBeRead')}
        </p>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title={say('common.preTranscoding')}
      actions={
        saved.isEnabled ? (
          <>
            <PanelCardAction
              icon={saved.isPaused ? PlayFilledIcon : PauseFilledIcon}
              isLoading={isSaving}
              onClick={() => {
                void store(
                  { ...saved, isPaused: !saved.isPaused },
                  saved.isPaused
                    ? say('screens.adminArea.preTranscodingCard.preTranscodingCarriesOn')
                    : say('screens.adminArea.preTranscodingCard.preTranscodingIsPaused'),
                );
              }}
            >
              {saved.isPaused ? say('common.resume') : say('common.pause')}
            </PanelCardAction>

            <PanelCardAction
              icon={PlayFilledIcon}
              isLoading={isRunning}
              onClick={() => void runNow()}
            >
              {say('screens.adminArea.preTranscodingCard.makeTheNextCopyNow')}
            </PanelCardAction>
          </>
        ) : null
      }
    >
      <div className="flex flex-col gap-5">
        <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
          {say('screens.adminArea.preTranscodingCard.keepsACopyOfEachFilm')}
        </p>

        {status === undefined || !saved.isEnabled ? null : (
          <StatStrip
            stats={[
              {
                label: say('screens.adminArea.preTranscodingCard.copiesMade'),
                value: status.copiesMade.toString(),
              },
              {
                label: say('screens.adminArea.preTranscodingCard.stillToMake'),
                value: status.stillNeeded.toString(),
              },
              {
                label: say('screens.adminArea.preTranscodingCard.passedOver'),
                value: status.givenUp.toString(),
                detail: say('screens.adminArea.preTranscodingCard.refusedOrFailedTwice'),
              },
              {
                label: say('screens.adminArea.preTranscodingCard.rightNow'),
                value: saved.isPaused
                  ? say('common.paused')
                  : status.isInWindow
                    ? say('common.working')
                    : say('screens.adminArea.preTranscodingCard.waitingForQuietHours'),
              },
            ]}
          />
        )}

        {current === null ? null : (
          <ProgressBar
            label={say('screens.adminArea.preTranscodingCard.makingACopyOfTitle', {
              title: current.title,
            })}
            value={current.state === 'queued' ? 0 : current.progress}
            max={1}
            readout={
              <span className="font-body text-xs text-text-muted">
                {say('screens.adminArea.preTranscodingCard.makingACopyOfTitle', {
                  title: current.title,
                })}
                {` · ${describeReencodeState(current.state)}`}
                {describeEncodeProgress(current) === ''
                  ? ''
                  : ` · ${describeEncodeProgress(current)}`}
              </span>
            }
          />
        )}

        <SettingList>
          <SettingRow
            title={say('common.preTranscoding')}
            description={say('screens.adminArea.preTranscodingCard.eachCopyTakesDiskBesideIts')}
          >
            <Switch
              label={say('common.preTranscoding')}
              isLabelHidden
              isOn={draft.isEnabled}
              onToggle={() => {
                change({ isEnabled: !draft.isEnabled });
              }}
            />
          </SettingRow>
        </SettingList>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-text">
              {say('screens.adminArea.preTranscodingCard.theLadder')}
            </h3>
            <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
              {say('screens.adminArea.preTranscodingCard.aCopyIsMadeAtEveryRung')}
            </p>
          </div>

          <ol className="flex flex-col gap-2">
            {draft.targets.map((target, index) => (
              <LadderRung
                key={index}
                target={target}
                bitrate={bitrates[index] ?? ''}
                progress={isEdited ? null : (status?.ladder[index] ?? null)}
                isRemovable={draft.targets.length > 1}
                onChange={(patch) => {
                  changeRung(index, patch);
                }}
                onBitrateChange={(next) => {
                  setIsEdited(true);
                  setBitrates((before) => before.map((one, at) => (at === index ? next : one)));
                }}
                onRemove={() => {
                  change({ targets: draft.targets.filter((_, at) => at !== index) });
                  setBitrates((before) => before.filter((_, at) => at !== index));
                }}
              />
            ))}
          </ol>

          <Button
            variant="secondary"
            size="sm"
            disabled={draft.targets.length >= MOST_PRE_TRANSCODE_TARGETS}
            onClick={() => {
              change({ targets: [...draft.targets, rungBelow(draft.targets)] });
              setBitrates((before) => [...before, '']);
            }}
            className="self-start"
          >
            <Icon of={PlusIcon} size={14} />
            {say('screens.adminArea.preTranscodingCard.addARung')}
          </Button>
        </section>

        <SettingList>
          <SettingRow
            title={say('screens.reencodeDialog.compressTheLosslessAudioToo')}
            description={say('screens.reencodeDialog.aTrueHDOrDTSHDTrack')}
          >
            <Switch
              label={say('screens.reencodeDialog.compressTheLosslessAudioToo')}
              isLabelHidden
              isOn={compressesAudio}
              onToggle={() => {
                change({
                  targets: draft.targets.map((target) => ({
                    ...target,
                    audio: compressesAudio ? 'keep' : 'compress',
                  })),
                });
              }}
            />
          </SettingRow>

          <SettingRow
            title={say('screens.observabilityPage.schedule')}
            description={
              draft.schedule === 'window'
                ? say('screens.adminArea.preTranscodingCard.onlyBetweenTheseHoursOnThe', {
                    timezone: status?.timezone ?? '',
                  })
                : say('screens.adminArea.preTranscodingCard.atAnyHourUntilEveryFile')
            }
          >
            <div className="flex flex-col items-end gap-2">
              <SegmentedRow
                label={say('screens.observabilityPage.schedule')}
                size="sm"
                tone="accent"
                items={SCHEDULE_CHOICES}
                value={draft.schedule}
                onSelect={(id) => {
                  change({ schedule: id === 'untilDone' ? 'untilDone' : 'window' });
                }}
              />

              {draft.schedule === 'window' ? (
                <div className="flex w-64 max-w-full flex-col gap-2">
                  <Choice
                    label={say('screens.adminArea.preTranscodingCard.startingAt')}
                    value={draft.windowStartHour.toString()}
                    options={HOUR_CHOICES}
                    onSelect={(id) => {
                      change({ windowStartHour: Number(id) });
                    }}
                  />

                  <Choice
                    label={say('screens.adminArea.preTranscodingCard.endingAt')}
                    value={draft.windowEndHour.toString()}
                    options={HOUR_CHOICES}
                    onSelect={(id) => {
                      change({ windowEndHour: Number(id) });
                    }}
                  />
                </div>
              ) : null}
            </div>
          </SettingRow>
        </SettingList>

        <div className="flex flex-col gap-3">
          <Checkbox
            label={say('screens.adminArea.preTranscodingCard.everyLibraryOfFilmsAndShows')}
            description={say('screens.adminArea.preTranscodingCard.includingOnesAddedLater')}
            checked={draft.libraryIds === null}
            onCheckedChange={(isEvery) => {
              change({
                libraryIds: isEvery ? null : videoLibraries.map((one) => one.id),
              });
            }}
          />

          {draft.libraryIds === null ? null : (
            <LibraryPicker
              libraries={[...videoLibraries]}
              chosen={new Set(draft.libraryIds)}
              onChange={(next) => {
                change({ libraryIds: [...next] });
              }}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            disabled={!isChanged || hasInvalidBitrate}
            onClick={() => {
              void store(
                chosen,
                say('screens.adminArea.preTranscodingCard.savedPreTranscoding'),
              ).then((isStored) => {
                if (isStored) {
                  setIsEdited(false);
                }
              });
            }}
          >
            {say('common.save')}
          </Button>
        </div>
      </div>
    </PanelCard>
  );
};

PreTranscodingCard.displayName = 'PreTranscodingCard';

export { PreTranscodingCard };
