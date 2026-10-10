import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SelectField } from '@ValenceUI/SelectField';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeEncodeProgress } from '@ValenceClient/admin/describeEncodeProgress';
import { describeReencodeState } from '@ValenceClient/admin/describeReencodeState';
import { runPreTranscodingNow } from '@ValenceClient/admin/runPreTranscodingNow';
import { savePreTranscoding } from '@ValenceClient/admin/savePreTranscoding';
import {
  DEFAULT_PRE_TRANSCODE_TARGET,
  MOST_PRE_TRANSCODE_TARGETS,
  PRE_TRANSCODE_QUALITIES,
  PRE_TRANSCODING_DEFAULTS,
} from '@ValenceContracts/schemas/PreTranscoding';
import { failureOfAnswer, failureOfMissing } from '@ValenceScreens/admin/failureOf';
import { readBitrate } from '@ValenceScreens/admin/readBitrate';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { LibraryPicker } from '@ValenceScreens/components/AdminArea/components/LibraryPicker/LibraryPicker';
import { StatStrip } from '@ValenceScreens/components/AdminArea/components/StatStrip/StatStrip';
import { say } from '@ValenceI18n/say';
import { describeHour } from './describeHour';
import { LadderTable } from './components/LadderTable/LadderTable';
import type {
  PreTranscodeTarget,
  PreTranscodeTargetProgress,
  PreTranscodingSettings,
} from '@ValenceContracts/schemas/PreTranscoding';
import type { DraftRung } from './components/LadderTable/LadderTable.types';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import type { PreTranscodingCardProps } from './PreTranscodingCard.types';
import { randomId } from '@ValenceClient/platform/randomId';

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
 * The ladder as rows that can be edited and dragged, each with a name of its own and its ceiling as
 * text, which is empty where it has none.
 *
 * @param targets - The rungs.
 * @returns The rows.
 */
const asRungs = (targets: readonly PreTranscodeTarget[]) =>
  targets.map((target) => ({
    id: randomId(),
    target,
    bitrate: target.maxBitrateKbps === null ? '' : target.maxBitrateKbps.toString(),
  }));

/**
 * What tells one rung from another, so a rung's progress follows it wherever it is dragged.
 *
 * @param target - The rung.
 * @returns Its identity as text.
 */
const keyOf = (target: PreTranscodeTarget): string =>
  [
    target.quality,
    target.videoCodec,
    target.container,
    target.maxBitrateKbps ?? 'any',
    target.audio,
  ].join('/');

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
  const [rungs, setRungs] = useState(() => asRungs(saved.targets));
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    if (isEdited) {
      return;
    }

    setDraft(saved);
    setRungs(asRungs(saved.targets));
  }, [saved, isEdited]);

  const videoLibraries = useMemo(
    () => libraries.filter((one) => VIDEO_LIBRARY_KINDS.includes(one.kind)),
    [libraries],
  );

  const status = asked.data;
  const current = status?.current ?? null;
  const progressOf = (target: PreTranscodeTarget): PreTranscodeTargetProgress | null =>
    status?.ladder.find((rung) => keyOf(rung.target) === keyOf(target)) ?? null;

  const targets = rungs.map((rung) => {
    const reading = readBitrate(rung.bitrate);

    return { ...rung.target, maxBitrateKbps: reading.kind === 'kbps' ? reading.kbps : null };
  });
  const hasInvalidBitrate = rungs.some((rung) => readBitrate(rung.bitrate).kind === 'invalid');
  const chosen: PreTranscodingSettings = { ...draft, isPaused: saved.isPaused, targets };
  const isChanged = JSON.stringify(chosen) !== JSON.stringify(saved);
  const compressesAudio = rungs.every((rung) => rung.target.audio === 'compress');
  const tallest = draft.keepsOriginal
    ? null
    : rungs.reduce<(typeof rungs)[number] | null>(
        (best, rung) =>
          best === null ||
          PRE_TRANSCODE_QUALITIES.indexOf(rung.target.quality) <
            PRE_TRANSCODE_QUALITIES.indexOf(best.target.quality)
            ? rung
            : best,
        null,
      );
  const tableRungs: DraftRung[] = rungs.map((rung, index) => ({
    ...rung,
    progress: progressOf(targets[index] ?? rung.target),
    replacesOriginal: rung.id === tallest?.id,
  }));

  const change = (patch: Partial<PreTranscodingSettings>) => {
    setIsEdited(true);
    setDraft((before) => ({ ...before, ...patch }));
  };

  const changeRungs = (next: (before: typeof rungs) => typeof rungs) => {
    setIsEdited(true);
    setRungs(next);
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

  useAdminCommand('makeNextCopy', () => {
    void runNow();
  });

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

          <div className="flex flex-col pb-4">
            <SettingRow
              title={say('screens.adminArea.preTranscodingCard.theLadder')}
              description={say('screens.adminArea.preTranscodingCard.aCopyIsMadeAtEveryRung')}
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={rungs.length >= MOST_PRE_TRANSCODE_TARGETS}
                onClick={() => {
                  changeRungs((before) => [
                    ...before,
                    { id: randomId(), target: rungBelow(targets), bitrate: '' },
                  ]);
                }}
              >
                <Icon of={PlusIcon} size={14} />
                {say('screens.adminArea.preTranscodingCard.addARung')}
              </Button>
            </SettingRow>

            <LadderTable
              rungs={tableRungs}
              onChange={(id, patch) => {
                changeRungs((before) =>
                  before.map((rung) =>
                    rung.id === id ? { ...rung, target: { ...rung.target, ...patch } } : rung,
                  ),
                );
              }}
              onBitrateChange={(id, bitrate) => {
                changeRungs((before) =>
                  before.map((rung) => (rung.id === id ? { ...rung, bitrate } : rung)),
                );
              }}
              onRemove={(id) => {
                changeRungs((before) => before.filter((rung) => rung.id !== id));
              }}
              onReorder={(ids) => {
                changeRungs((before) =>
                  ids.flatMap((id) => before.filter((rung) => rung.id === id)),
                );
              }}
            />
          </div>

          <SettingRow
            title={say('screens.adminArea.preTranscodingCard.keepTheOriginal')}
            description={
              draft.keepsOriginal
                ? say('screens.adminArea.preTranscodingCard.everyRungIsKeptBesideThe')
                : say('screens.adminArea.preTranscodingCard.theTallestRungReplacesTheOriginal')
            }
          >
            <Switch
              label={say('screens.adminArea.preTranscodingCard.keepTheOriginal')}
              isLabelHidden
              isOn={draft.keepsOriginal}
              onToggle={() => {
                change({ keepsOriginal: !draft.keepsOriginal });
              }}
            />
          </SettingRow>

          <SettingRow
            title={say('screens.reencodeDialog.compressTheLosslessAudioToo')}
            description={say('screens.reencodeDialog.aTrueHDOrDTSHDTrack')}
          >
            <Switch
              label={say('screens.reencodeDialog.compressTheLosslessAudioToo')}
              isLabelHidden
              isOn={compressesAudio}
              onToggle={() => {
                changeRungs((before) =>
                  before.map((rung) => ({
                    ...rung,
                    target: { ...rung.target, audio: compressesAudio ? 'keep' : 'compress' },
                  })),
                );
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
          </SettingRow>

          {draft.schedule === 'window' ? (
            <SettingRow title={say('screens.adminArea.preTranscodingCard.quietHours')}>
              <SelectField
                label={say('screens.adminArea.preTranscodingCard.startingAt')}
                isLabelHidden
                size="sm"
                options={HOUR_CHOICES}
                value={draft.windowStartHour.toString()}
                onSelect={(id) => {
                  change({ windowStartHour: Number(id) });
                }}
                className="w-28"
              />

              <span className="text-sm text-text-muted">–</span>

              <SelectField
                label={say('screens.adminArea.preTranscodingCard.endingAt')}
                isLabelHidden
                size="sm"
                options={HOUR_CHOICES}
                value={draft.windowEndHour.toString()}
                onSelect={(id) => {
                  change({ windowEndHour: Number(id) });
                }}
                className="w-28"
              />
            </SettingRow>
          ) : null}

          <div className="flex flex-col pb-4">
            <SettingRow
              title={say('screens.adminArea.preTranscodingCard.everyLibraryOfFilmsAndShows')}
              description={say('screens.adminArea.preTranscodingCard.includingOnesAddedLater')}
            >
              <Switch
                label={say('screens.adminArea.preTranscodingCard.everyLibraryOfFilmsAndShows')}
                isLabelHidden
                isOn={draft.libraryIds === null}
                onToggle={() => {
                  change({
                    libraryIds:
                      draft.libraryIds === null ? videoLibraries.map((one) => one.id) : null,
                  });
                }}
              />
            </SettingRow>

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
        </SettingList>

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
