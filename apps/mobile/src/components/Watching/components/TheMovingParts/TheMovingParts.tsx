import { useEvent } from 'expo';
import { describeSkip, skippableAt } from '@ValenceClient/playback/fetchSegments';
import { TheControls } from '@ValenceMobile/components/Watching/components/TheControls/TheControls';
import { TheSkip } from '@ValenceMobile/components/Watching/components/TheSkip/TheSkip';
import { TheSubtitles } from '@ValenceMobile/components/Watching/components/TheSubtitles/TheSubtitles';
import type { TheMovingPartsProps } from './TheMovingParts.types';

/**
 * Everything in the player that moves with the film: the offer to skip, the subtitles and the controls.
 *
 * It is the one part of the player told where the film has got to, so the picture and the panels
 * around it are not drawn again every time the clock moves.
 *
 * @param player - What is playing.
 * @param segments - The film's marked stretches, to offer skipping.
 * @param cues - The lines of the track being read.
 * @param subtitleOffset - How far the lines are moved against the film.
 * @param areControlsDrawn - Whether the controls are drawn.
 * @param controls - What the controls are told, apart from where the film is.
 */
const TheMovingParts = ({
  player,
  segments,
  cues,
  subtitleOffset,
  areControlsDrawn,
  controls,
}: TheMovingPartsProps) => {
  const ticking = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    bufferedPosition: player.bufferedPosition,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });
  const skippable = skippableAt(segments, ticking.currentTime);

  return (
    <>
      {skippable === null ? null : (
        <TheSkip
          says={describeSkip(skippable)}
          onSkip={() => {
            player.seekBy(skippable.endSeconds - ticking.currentTime);
          }}
        />
      )}

      <TheSubtitles
        cues={cues}
        atSeconds={ticking.currentTime - subtitleOffset}
        isClearOfTheControls={areControlsDrawn}
      />

      {areControlsDrawn ? (
        <TheControls
          {...controls}
          at={ticking.currentTime}
          runsFor={player.duration}
          buffered={ticking.bufferedPosition}
          onSeek={(to) => {
            controls.onTouched();
            player.seekBy(to - ticking.currentTime);
          }}
        />
      ) : null}
    </>
  );
};

TheMovingParts.displayName = 'TheMovingParts';

export { TheMovingParts };
