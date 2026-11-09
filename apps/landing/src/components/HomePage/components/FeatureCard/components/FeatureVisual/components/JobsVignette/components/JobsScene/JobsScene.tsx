import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { JobsPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/JobsVignette/components/JobsPicture/JobsPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';
import type { ProgressSummary } from '@ValenceScreens/components/AdminArea/components/JobRunner/summariseProgress';

const FPS = 30;

const SHOWN_AT = Date.parse('2026-11-09T22:00:50.000Z');

const PRESSES_AT = 64;

const DRAWS_AT = 150;

const FINISHES_AT = 206;

const FILES = 312;

const MISSING_THUMBNAILS = 18;

const PASSING = [
  'Harbour Lights - S02E04 - Low Tide.mkv',
  'Northbound (2024).mkv',
  'The Lantern Keepers (2021).mkv',
  'Paper Moons - S01E07 - Tin Roof.mkv',
  'Ember - S01E03 - Second Light.mkv',
];

/**
 * How far along the scan is at a frame of the scene, or null where it is not running: reading every
 * file first, then drawing the scrub previews the new ones are missing.
 *
 * @param frame - The frame.
 * @returns How far along it is.
 */
const scanAt = (frame: number): ProgressSummary | null => {
  if (frame < PRESSES_AT || frame >= FINISHES_AT) {
    return null;
  }

  const isDrawing = frame >= DRAWS_AT;
  const processed = Math.round(
    isDrawing
      ? interpolate(frame, [DRAWS_AT, FINISHES_AT - 6], [0, MISSING_THUMBNAILS], {
          extrapolateRight: 'clamp',
        })
      : interpolate(frame, [PRESSES_AT + 6, DRAWS_AT - 6], [0, FILES], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
  );

  return {
    phase: isDrawing ? 'trickplay' : 'probing',
    processed,
    total: isDrawing ? MISSING_THUMBNAILS : FILES,
    item: PASSING[Math.floor(frame / 9) % PASSING.length] ?? null,
    isStopping: false,
  };
};

/**
 * A slice of the admin's jobs at the app's own size, where the pointer runs the library scan by hand,
 * it reads every file and draws the scrub previews the new ones are missing, then rests again, so it
 * goes round without a seam.
 */
const JobsScene = () => {
  const frame = useCurrentFrame();
  const scan = scanAt(frame);

  return (
    <AbsoluteFill>
      <div
        className="absolute left-4 top-6 w-[37rem]"
        {...(scan === null ? {} : { 'data-acted': '' })}
      >
        <JobsPicture scan={scan} now={SHOWN_AT + (frame / FPS) * 1000} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 30, y: 92 },
          { at: PRESSES_AT - 30, x: 30, y: 92 },
          { at: PRESSES_AT - 4, x: 10.5, y: 49 },
          { at: PRESSES_AT, x: 10.5, y: 49, isPressing: true },
          { at: PRESSES_AT + 22, x: 31, y: 29 },
          { at: FINISHES_AT, x: 32, y: 30 },
          { at: 259, x: 30, y: 92 },
        ]}
      />
    </AbsoluteFill>
  );
};

JobsScene.displayName = 'JobsScene';

export { JobsScene };
