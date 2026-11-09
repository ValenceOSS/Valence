import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SessionCard } from '@ValenceScreens/components/AdminArea/components/SessionCard/SessionCard';
import { SessionLane } from '@ValenceScreens/components/AdminArea/components/SessionCards/components/SessionLane/SessionLane';
import { ShowcaseFace } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShowcaseFace/ShowcaseFace';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';
import { ShowcaseScope } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShowcaseScope/ShowcaseScope';
import { aShowcaseSession } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SessionsVignette/aShowcaseSession';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import { say } from '@ValenceI18n/say';

const FINDS_IT_DIRECT = 116;

const NEXT_EPISODE_FROM = 204;

const NEXT_EPISODE_TO = 222;

const EPISODE_SECONDS = 3120;

const EPISODE_STARTS_AT = 0.3;

const EPISODE_STARTS_ON = (NEXT_EPISODE_FROM + NEXT_EPISODE_TO) / 2;

/**
 * One person's three sessions open at a given moment, the phone's picture converted until it is found
 * to play the file as it lies.
 *
 * @param isDirect - Whether the phone has been found to play the file as it lies.
 * @param at - How far through its episode the phone is.
 * @returns The sessions.
 */
const sessionsAt = (isDirect: boolean, at: number) => [
  aShowcaseSession({
    id: 'mayas-phone',
    who: 'Maya',
    title: 'Ember',
    episode: { season: 1, number: 3, title: 'Second Light' },
    device: 'Maya’s phone',
    kind: 'phone',
    isConverting: !isDirect,
    at,
  }),
  aShowcaseSession({
    id: 'living-room',
    who: 'Maya',
    title: 'Harbour Lights',
    episode: { season: 2, number: 4, title: 'Low Tide' },
    device: 'Living room TV',
    kind: 'tv',
    isConverting: false,
    at: 0.62,
  }),
  aShowcaseSession({
    id: 'study',
    who: 'Maya',
    title: 'Northbound',
    device: 'Study laptop',
    kind: 'desktop',
    isConverting: false,
    at: 0.18,
  }),
];

/**
 * Three of one person's devices watching at once, drawn by the app's own row of session cards, as
 * the admin's sessions draw them, the phone being converted
 * for until it turns out to take the file as it is, when its badge goes from transcoding to direct
 * play — and then, as its next episode starts, being asked about again, which is where it began, so
 * it goes round without a seam.
 */
const DevicesScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const isDirect = frame >= FINDS_IT_DIRECT && frame < NEXT_EPISODE_FROM;
  const pop = spring({
    frame: frame - FINDS_IT_DIRECT,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  const restarting = interpolate(
    frame,
    [NEXT_EPISODE_FROM, (NEXT_EPISODE_FROM + NEXT_EPISODE_TO) / 2, NEXT_EPISODE_TO],
    [1, 0, 1],
    clamp,
  );
  const sinceItStarted =
    (((frame - EPISODE_STARTS_ON) % durationInFrames) + durationInFrames) % durationInFrames;
  const watched = EPISODE_STARTS_AT + sinceItStarted / fps / EPISODE_SECONDS;

  return (
    <AbsoluteFill>
      <ShowcaseScope>
        <PanelCard
          title={say('common.sessions')}
          hasFace={false}
          className="absolute left-2 top-6 w-[37.5rem] text-left"
        >
          <SessionLane
            name="Maya"
            face={<ShowcaseFace name="Maya" className="size-6.5 text-xs" />}
            count={3}
            size="small"
          >
            {sessionsAt(isDirect, watched).map((session) => (
              <div
                key={session.clientId}
                className="grid w-[15rem] shrink-0"
                style={
                  session.clientId === 'mayas-phone'
                    ? {
                        opacity: restarting,
                        transform: `scale(${(isDirect ? 0.98 + 0.02 * pop : 1).toString()})`,
                      }
                    : {}
                }
              >
                <SessionCard
                  session={session}
                  isBusy={false}
                  onStop={nothing}
                  onPause={nothing}
                  onResume={nothing}
                  onMessage={nothing}
                />
              </div>
            ))}
          </SessionLane>
        </PanelCard>
      </ShowcaseScope>

      <SceneCursor
        path={[
          { at: 0, x: 22, y: 92 },
          { at: 24, x: 22, y: 92 },
          { at: 70, x: 34.5, y: 45.5 },
          { at: FINDS_IT_DIRECT, x: 34.5, y: 45.5 },
          { at: 200, x: 34.5, y: 45.5 },
          { at: 239, x: 22, y: 92 },
        ]}
      />
    </AbsoluteFill>
  );
};

DevicesScene.displayName = 'DevicesScene';

export { DevicesScene };
