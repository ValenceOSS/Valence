import { Button } from '@ValenceUI/Button';
import { RangeSlider } from '@ValenceUI/RangeSlider';
import {
  RECOMMENDED_QUALITY_SIZES,
  VIDEO_QUALITIES,
} from '@ValenceContracts/schemas/QualityProfile';
import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import { describeSizeAnHour } from '@ValenceScreens/components/AdminArea/components/ProfileEditor/describeSizeAnHour';
import {
  SIZE_STEPS,
  positionOf,
  sizeAt,
} from '@ValenceScreens/components/AdminArea/components/ProfileEditor/sizeScale';
import type { QualitySize } from '@ValenceContracts/schemas/QualityProfile';
import type { QualitySizesProps } from './QualitySizes.types';

/**
 * Says a quality's limits in words.
 *
 * @param size - Its limits.
 * @returns Such as `At least 750 MB an hour, and no more than 5.9 GB an hour`.
 */
const describeLimits = ({ minMb, maxMb }: Pick<QualitySize, 'minMb' | 'maxMb'>): string => {
  if (minMb === null && maxMb === null) {
    return 'Any size';
  }

  if (maxMb === null) {
    return `At least ${describeSizeAnHour(minMb ?? 0)}`;
  }

  return minMb === null
    ? `No more than ${describeSizeAnHour(maxMb)}`
    : `${describeSizeAnHour(minMb)} to ${describeSizeAnHour(maxMb)}`;
};

/**
 * The smallest and largest a release may be for each quality the profile takes, an hour of it, the
 * way Radarr's quality settings are: one track for each, its handles at either end for no limit.
 * Only the qualities a profile takes are shown, best first, and the sizes TRaSH's guides recommend
 * can be put back at any time.
 *
 * @param resolutions - The resolutions the profile takes.
 * @param sources - The sources the profile takes.
 * @param sizes - The limits kept for each quality.
 * @param onChange - Told the limits as they change.
 */
const QualitySizes = ({ resolutions, sources, sizes, onChange }: QualitySizesProps) => {
  const shown = VIDEO_QUALITIES.filter(
    (quality) => resolutions.includes(quality.resolution) && sources.includes(quality.source),
  );

  const change = (next: QualitySize) => {
    onChange([
      ...sizes.filter((size) => size.source !== next.source || size.resolution !== next.resolution),
      ...(next.minMb === null && next.maxMb === null ? [] : [next]),
    ]);
  };

  return (
    <div className="flex flex-col gap-3">
      {shown.length === 0 ? (
        <p className="font-body text-sm text-text-muted">
          Tick a resolution and a source to set how large each may be.
        </p>
      ) : (
        <ul aria-label="Sizes for each quality" className="flex flex-col gap-3">
          {shown.map((quality) => {
            const name = `${QUALITY_NAMES[quality.source]} ${QUALITY_NAMES[quality.resolution]}`;
            const size = sizes.find(
              (one) => one.source === quality.source && one.resolution === quality.resolution,
            ) ?? { ...quality, minMb: null, maxMb: null };
            const lowest = positionOf(size.minMb, 'smallest');
            const highest = positionOf(size.maxMb, 'largest');

            return (
              <li
                key={name}
                className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[9rem_1fr_14rem]"
              >
                <span className="text-sm font-medium text-text">{name}</span>

                <RangeSlider
                  label={`Sizes for ${name}`}
                  thumbLabels={[`Smallest for ${name}`, `Largest for ${name}`]}
                  values={[lowest, highest]}
                  max={SIZE_STEPS}
                  onValuesChange={([lower, upper]) => {
                    change({
                      ...size,
                      minMb: lower === lowest ? size.minMb : sizeAt(lower),
                      maxMb: upper === highest ? size.maxMb : sizeAt(upper),
                    });
                  }}
                />

                <span className="text-xs tabular-nums text-text-muted">{describeLimits(size)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            onChange([...RECOMMENDED_QUALITY_SIZES]);
          }}
        >
          Use TRaSH’s recommended sizes
        </Button>
      </span>
    </div>
  );
};

QualitySizes.displayName = 'QualitySizes';

export { QualitySizes };
