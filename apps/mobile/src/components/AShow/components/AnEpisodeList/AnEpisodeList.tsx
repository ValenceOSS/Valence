import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AMissingEpisode } from '@ValenceMobile/components/AShow/components/AMissingEpisode/AMissingEpisode';
import { AnEpisode } from '@ValenceMobile/components/AShow/components/AnEpisode/AnEpisode';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { AnEpisodeListProps } from './AnEpisodeList.types';

const AT_FIRST = 20;

const EACH_STEP = 40;

const styles = StyleSheet.create({
  divided: { borderTopWidth: StyleSheet.hairlineWidth },
});

/**
 * A season's episodes and the gaps among them, one row each with a faint line between. A long season
 * — an anime's runs to hundreds — is drawn a little at a time, the first rows at once and the rest a
 * batch a frame, so choosing it answers straight away rather than holding the screen while every row
 * is laid out.
 *
 * @param rows - The season laid out, gaps and all.
 * @param watchedOf - How much of an episode has been seen, as a fraction.
 * @param resumeOf - Where somebody left an episode, or nothing.
 * @param onWatch - Told to play an episode, and from where.
 * @param onLookAt - Told to open an episode's own page.
 * @param onMarkWatched - Told to mark an episode watched, or unwatched again.
 */
const AnEpisodeList = ({
  rows,
  watchedOf,
  resumeOf,
  onWatch,
  onLookAt,
  onMarkWatched,
}: AnEpisodeListProps) => {
  const colours = useTheColours();
  const [drawn, setDrawn] = useState(AT_FIRST);

  useEffect(() => {
    if (drawn >= rows.length) {
      return undefined;
    }

    const next = requestAnimationFrame(() => {
      setDrawn((was) => was + EACH_STEP);
    });

    return () => {
      cancelAnimationFrame(next);
    };
  }, [drawn, rows.length]);

  return (
    <View>
      {rows.slice(0, drawn).map((row, place) => (
        <View
          key={row.key}
          style={
            place === 0 ? null : [styles.divided, { borderTopColor: withAlpha(colours.text, 0.14) }]
          }
        >
          {row.episode === null ? (
            <AMissingEpisode
              at={row.at}
              title={row.listed?.title ?? null}
              stillUrl={row.listed?.stillUrl ?? null}
              airs={row.airs}
            />
          ) : (
            <AnEpisode
              episode={row.episode}
              watched={watchedOf(row.episode.id)}
              resumeSeconds={resumeOf(row.episode.id)}
              airs={row.airs}
              onWatch={onWatch}
              onLookAt={onLookAt}
              onMarkWatched={onMarkWatched}
            />
          )}
        </View>
      ))}
    </View>
  );
};

AnEpisodeList.displayName = 'AnEpisodeList';

export { AnEpisodeList };
