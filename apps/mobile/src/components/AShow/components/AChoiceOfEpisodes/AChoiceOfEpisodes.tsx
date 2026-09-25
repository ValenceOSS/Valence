import { Download } from '@keyline-icons/react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { APick } from '@ValenceMobile/components/AShow/components/AChoiceOfEpisodes/components/APick/APick';
import type { AChoiceOfEpisodesProps } from './AChoiceOfEpisodes.types';

const styles = StyleSheet.create({
  episode: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingVertical: 10 },
  episodeWords: { flex: 1, gap: 2 },
  number: { minWidth: 24 },
  season: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 6,
    paddingTop: 20,
  },
});

/**
 * Picks which episodes of a programme to download, in the phone's own sheet: every season with its
 * episodes under it, a season picked or let go of whole by pressing it, and one download for
 * whatever is picked.
 *
 * What is already on this phone is shown, so the list reads as the programme does, and cannot be
 * picked again.
 *
 * @param isOpen - Whether the sheet is up.
 * @param seasons - The programme's seasons, each with the episodes the library holds.
 * @param held - The episodes already on this phone.
 * @param onClose - Told the sheet was put away without downloading anything.
 * @param onChosen - Told which episodes to download.
 */
const AChoiceOfEpisodes = ({
  isOpen,
  seasons,
  held,
  onClose,
  onChosen,
}: AChoiceOfEpisodesProps) => {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());

  const pickable = (episodes: AChoiceOfEpisodesProps['seasons'][number]['episodes']) =>
    episodes.filter((episode) => !held.has(episode.id)).map((episode) => episode.id);

  const flip = (ids: readonly string[], isOn: boolean) => {
    setPicked((was) => {
      const next = new Set(was);

      for (const id of ids) {
        if (isOn) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }

      return next;
    });
  };

  const close = () => {
    setPicked(new Set());
    onClose();
  };

  return (
    <ASheet
      isOpen={isOpen}
      title="Choose episodes"
      closeLabel="Cancel"
      onClose={close}
      footer={
        <Button
          icon={Download}
          isWide
          isDisabled={picked.size === 0}
          onPress={() => {
            const ids = [...picked];

            setPicked(new Set());
            onChosen(ids);
          }}
        >
          {picked.size === 0
            ? 'Pick some episodes'
            : `Download ${picked.size === 1 ? '1 episode' : `${picked.size.toString()} episodes`}`}
        </Button>
      }
    >
      {seasons.map((season) => {
        const open = pickable(season.episodes);
        const chosen = open.filter((id) => picked.has(id)).length;
        const standing = chosen === 0 ? 'none' : chosen === open.length ? 'all' : ('some' as const);

        return (
          <View key={season.seasonNumber ?? 'other'}>
            <Button
              tone="bare"
              label={`${standing === 'all' ? 'Let go of' : 'Pick'} ${nameSeason(season.seasonNumber)}`}
              isDisabled={open.length === 0}
              onPress={() => {
                flip(open, standing !== 'all');
              }}
            >
              <View style={styles.season}>
                <APick standing={standing} />
                <Words size="heading">{nameSeason(season.seasonNumber)}</Words>
              </View>
            </Button>

            {season.episodes.map((episode) => {
              const isHeld = held.has(episode.id);
              const isPicked = picked.has(episode.id);

              return (
                <Button
                  key={episode.id}
                  tone="bare"
                  label={episode.title}
                  isChosen={isPicked}
                  isDisabled={isHeld}
                  onPress={() => {
                    flip([episode.id], !isPicked);
                  }}
                >
                  <View style={styles.episode}>
                    <APick standing={isPicked ? 'all' : 'none'} />
                    <View style={styles.number}>
                      <Words size="small" tone="muted">
                        {episode.episodeNumber ?? '—'}
                      </Words>
                    </View>
                    <View style={styles.episodeWords}>
                      <Words lines={1} tone={isHeld ? 'muted' : 'plain'}>
                        {episode.title}
                      </Words>
                      {isHeld ? (
                        <Words size="small" tone="muted">
                          On this phone
                        </Words>
                      ) : null}
                    </View>
                  </View>
                </Button>
              );
            })}
          </View>
        );
      })}
    </ASheet>
  );
};

AChoiceOfEpisodes.displayName = 'AChoiceOfEpisodes';

export { AChoiceOfEpisodes };
