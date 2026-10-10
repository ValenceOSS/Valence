import { Bin as BinIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { CODEC_NAMES } from '@ValenceCore/functions/renditionLabel';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { PRE_TRANSCODE_QUALITIES } from '@ValenceContracts/schemas/PreTranscoding';
import { REENCODE_CODECS, REENCODE_CONTAINERS } from '@ValenceContracts/schemas/Reencode';
import { readBitrate } from '@ValenceScreens/admin/readBitrate';
import { say } from '@ValenceI18n/say';
import type { LadderRungProps } from './LadderRung.types';

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

/**
 * One rung of the pre-transcoding ladder: the picture, codec and container a copy is made at, the
 * most bits a second it may spend, and how far the library has got at that rung.
 *
 * @param target - The rung as it is set.
 * @param bitrate - The ceiling as typed, which may not be a number yet.
 * @param progress - How many copies the rung has made and has still to make, where it has been saved.
 * @param isRemovable - Whether the rung may go, which the last one may not.
 * @param onChange - Called with what changed about the rung.
 * @param onBitrateChange - Called with the ceiling as typed.
 * @param onRemove - Called to take the rung off the ladder.
 */
const LadderRung = ({
  target,
  bitrate,
  progress,
  isRemovable,
  onChange,
  onBitrateChange,
  onRemove,
}: LadderRungProps) => {
  const quality = QUALITY_CHOICES.find((one) => one.id === target.quality)?.label ?? target.quality;
  const reading = readBitrate(bitrate);

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-[var(--surface-line)] p-3">
      <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))_9rem_auto]">
        <SelectField
          label={say('common.quality')}
          isLabelHidden
          size="sm"
          options={QUALITY_CHOICES}
          value={target.quality}
          onSelect={(id) => {
            onChange({ quality: PRE_TRANSCODE_QUALITIES.find((one) => one === id) ?? '1080p' });
          }}
        />

        <SelectField
          label={say('screens.reencodeDialog.codec')}
          isLabelHidden
          size="sm"
          options={CODEC_CHOICES}
          value={target.videoCodec}
          onSelect={(id) => {
            onChange({ videoCodec: REENCODE_CODECS.find((one) => one === id) ?? 'h264' });
          }}
        />

        <SelectField
          label={say('screens.adminArea.preTranscodingCard.container')}
          isLabelHidden
          size="sm"
          options={CONTAINER_CHOICES}
          value={target.container}
          onSelect={(id) => {
            onChange({ container: REENCODE_CONTAINERS.find((one) => one === id) ?? 'mp4' });
          }}
        />

        <TextField
          label={say('screens.adminArea.preTranscodingCard.bitrateCeiling')}
          isLabelHidden
          type="number"
          size="sm"
          min={100}
          placeholder={say('common.noCeiling')}
          value={bitrate}
          onValueChange={onBitrateChange}
          {...(reading.kind === 'invalid'
            ? { error: say('screens.adminArea.preTranscodingCard.aWholeNumberFrom100') }
            : {})}
        />

        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          label={say('screens.adminArea.preTranscodingCard.removeTheQualityRung', { quality })}
          disabled={!isRemovable}
          onClick={onRemove}
          className="justify-self-end"
        >
          <Icon of={BinIcon} size={15} />
        </Button>
      </div>

      {progress === null ? null : (
        <p className="font-body text-xs text-text-muted">
          {say('screens.adminArea.preTranscodingCard.madeStillToMakeAndKept', {
            made: progress.copiesMade.toString(),
            left: progress.stillNeeded.toString(),
            size: formatBytes(progress.bytesKept),
          })}
        </p>
      )}
    </li>
  );
};

LadderRung.displayName = 'LadderRung';

export { LadderRung };
