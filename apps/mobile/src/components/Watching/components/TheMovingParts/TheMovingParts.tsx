import { useEvent } from 'expo';
import { useEffect, useState } from 'react';
import { describeSkip, skippableAt } from '@ValenceClient/playback/fetchSegments';
import { nextEpisodeOfferAt } from '@ValenceClient/playback/nextEpisodeOfferAt';
import { TheNextEpisode } from '@ValenceMobile/components/Watching/components/TheNextEpisode/TheNextEpisode';
import { TheControls } from '@ValenceMobile/components/Watching/components/TheControls/TheControls';
import { TheSkip } from '@ValenceMobile/components/Watching/components/TheSkip/TheSkip';
import { TheSubtitles } from '@ValenceMobile/components/Watching/components/TheSubtitles/TheSubtitles';
import type { TheMovingPartsProps } from './TheMovingParts.types';

/**
 * Everything in the player that moves with the film: the offer to skip, the offer of the next
 * episode as one ends, the subtitles and the controls.
 *
 * It is the one part of the player told where the film has got to, so the picture and the panels
 * around it are not drawn again every time the clock moves.
 *
 * @param player - What is playing.
 * @param segments - The film's marked stretches, to offer skipping.
 * @param cues - The lines of the track being read.
 * @param subtitleOffset - How far the lines are moved against the film.
 * @param captionStyle - How this phone draws the lines.
 * @param areControlsDrawn - Whether the controls are drawn.
 * @param onMoveTo - Told to move the film to a moment, by skipping a marked stretch or scrubbing.
 * @param next - Whether the next episode starts on its own at the end, whether the player is held
 *   at the end after a move there, and how to start it now; or null where there is no next episode,
 *   or nothing is to be offered just now.
 * @param controls - What the controls are told, apart from where the film is.
 */
const TheMovingParts = ({
  player,
  segments,
  cues,
  subtitleOffset,
  captionStyle,
  areControlsDrawn,
  onMoveTo,
  next,
  controls,
}: TheMovingPartsProps) => {
  const [isNextAway, setIsNextAway] = useState(false);
  const ticking = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    bufferedPosition: player.bufferedPosition,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });
  const offerHere =
    next === null
      ? null
      : nextEpisodeOfferAt({
          segments,
          positionSeconds: ticking.currentTime,
          durationSeconds: player.duration,
        });
  const isInTheEnd = offerHere !== null;
  const offer = isNextAway && next?.isHeldAtTheEnd !== true ? null : offerHere;

  useEffect(() => {
    if (!isInTheEnd) {
      setIsNextAway(false);
    }
  }, [isInTheEnd]);
  const skippable = offer === null ? skippableAt(segments, ticking.currentTime) : null;

  return (
    <>
      {offer === null || next === null ? null : (
        <TheNextEpisode
          offer={offer}
          isCounting={next.isCounting}
          onPlay={next.onPlay}
          onWatchCredits={() => {
            setIsNextAway(true);
          }}
        />
      )}

      {skippable === null ? null : (
        <TheSkip
          says={describeSkip(skippable)}
          onSkip={() => {
            onMoveTo(skippable.endSeconds);
          }}
        />
      )}

      <TheSubtitles
        cues={cues}
        atSeconds={ticking.currentTime - subtitleOffset}
        captionStyle={captionStyle}
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
            onMoveTo(to);
          }}
        />
      ) : null}
    </>
  );
};

TheMovingParts.displayName = 'TheMovingParts';

export { TheMovingParts };
