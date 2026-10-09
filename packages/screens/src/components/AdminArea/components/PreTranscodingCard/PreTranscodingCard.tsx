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
import { TextField } from '@ValenceUI/TextField';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeEncodeProgress } from '@ValenceClient/admin/describeEncodeProgress';
import { describeReencodeState } from '@ValenceClient/admin/describeReencodeState';
import { runPreTranscodingNow } from '@ValenceClient/admin/runPreTranscodingNow';
import { savePreTranscoding } from '@ValenceClient/admin/savePreTranscoding';
import { CODEC_NAMES } from '@ValenceCore/functions/renditionLabel';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import {
  PRE_TRANSCODE_QUALITIES,
  PRE_TRANSCODING_DEFAULTS,
} from '@ValenceContracts/schemas/PreTranscoding';
import { REENCODE_CODECS, REENCODE_CONTAINERS } from '@ValenceContracts/schemas/Reencode';
import { failureOfAnswer, failureOfMissing } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { LibraryPicker } from '@ValenceScreens/components/AdminArea/components/LibraryPicker/LibraryPicker';
import { StatStrip } from '@ValenceScreens/components/AdminArea/components/StatStrip/StatStrip';
import { describeHour } from './describeHour';
import { readBitrate } from '@ValenceScreens/admin/readBitrate';
import type { PreTranscodingSettings } from '@ValenceContracts/schemas/PreTranscoding';
import type { PreTranscodingCardProps } from './PreTranscodingCard.types';
import { say } from '@ValenceI18n/say';

const QUALITY_CHOICES = PRE_TRANSCODE_QUALITIES.map((id) => ({
  id,
  label: QUALITY_STEPS.find((step) => step.id === id)?.label ?? id,
}));

const CODEC_CHOICES = REENCODE_CODECS.map((codec) => ({
  id: codec,
  label: CODEC_NAMES[codec] ?? codec,
}));

const CONTAINER_CHOICES = REENCODE_CONTAINERS.map((container) => ({
  id: container,
  label: container.toUpperCase(),
}));

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
 * Pre-transcoding, where it is set up and watched: a copy of each film and episode kept beside it
 * that a modest device plays without the server converting it, made in the hours chosen. Shows how
 * far it has got and the copy being made now, lets it be paused or asked to make the next copy at
 * once, and saves what is changed only when asked to.
 *
 * @param libraries - Every library, of which only those holding films or episodes are offered.
 */
const PreTranscodingCard = ({ libraries }: PreTranscodingCardProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.preTranscoding());
  const saved = asked.data?.settings ?? PRE_TRANSCODING_DEFAULTS;
  const [draft, setDraft] = useState<PreTranscodingSettings>(saved);
  const [bitrate, setBitrate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    if (isEdited) {
      return;
    }

    setDraft(saved);
    setBitrate(saved.maxBitrateKbps === null ? '' : saved.maxBitrateKbps.toString());
  }, [saved, isEdited]);

  const videoLibraries = useMemo(
    () => libraries.filter((one) => VIDEO_LIBRARY_KINDS.includes(one.kind)),
    [libraries],
  );

  const reading = readBitrate(bitrate);
  const chosen: PreTranscodingSettings = {
    ...draft,
    isPaused: saved.isPaused,
    maxBitrateKbps: reading.kind === 'kbps' ? reading.kbps : null,
  };
  const isChanged = JSON.stringify(chosen) !== JSON.stringify(saved);

  const change = (patch: Partial<PreTranscodingSettings>) => {
    setIsEdited(true);
    setDraft((before) => ({ ...before, ...patch }));
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

          <SettingRow
            title={say('screens.adminArea.preTranscodingCard.whatEachCopyIs')}
            description={say('screens.adminArea.preTranscodingCard.aCopyIsNeverLargerThan')}
          >
            <div className="flex w-64 max-w-full flex-col gap-2">
              <Choice
                label={say('common.quality')}
                value={draft.quality}
                options={QUALITY_CHOICES}
                onSelect={(id) => {
                  change({ quality: PRE_TRANSCODE_QUALITIES.find((one) => one === id) ?? '1080p' });
                }}
              />

              <Choice
                label={say('screens.reencodeDialog.codec')}
                value={draft.videoCodec}
                options={CODEC_CHOICES}
                onSelect={(id) => {
                  change({ videoCodec: REENCODE_CODECS.find((one) => one === id) ?? 'h264' });
                }}
              />

              <Choice
                label={say('screens.adminArea.preTranscodingCard.container')}
                value={draft.container}
                options={CONTAINER_CHOICES}
                onSelect={(id) => {
                  change({ container: REENCODE_CONTAINERS.find((one) => one === id) ?? 'mp4' });
                }}
              />
            </div>
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.preTranscodingCard.bitrateCeiling')}
            description={say('screens.adminArea.preTranscodingCard.inKilobitsASecondLeaveEmpty')}
          >
            <TextField
              label={say('screens.adminArea.preTranscodingCard.bitrateCeiling')}
              isLabelHidden
              type="number"
              size="sm"
              min={100}
              placeholder={say('common.noCeiling')}
              value={bitrate}
              onValueChange={(next) => {
                setIsEdited(true);
                setBitrate(next);
              }}
              {...(reading.kind === 'invalid'
                ? { error: say('screens.adminArea.preTranscodingCard.aWholeNumberFrom100') }
                : {})}
              className="w-40"
            />
          </SettingRow>

          <SettingRow
            title={say('screens.reencodeDialog.compressTheLosslessAudioToo')}
            description={say('screens.reencodeDialog.aTrueHDOrDTSHDTrack')}
          >
            <Switch
              label={say('screens.reencodeDialog.compressTheLosslessAudioToo')}
              isLabelHidden
              isOn={draft.audio === 'compress'}
              onToggle={() => {
                change({ audio: draft.audio === 'compress' ? 'keep' : 'compress' });
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
            disabled={!isChanged || reading.kind === 'invalid'}
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
