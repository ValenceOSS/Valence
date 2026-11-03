import { Check } from '@keyline-icons/react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { SidePanel } from '@ValenceTv/components/SidePanel/SidePanel';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { tokens } from '@ValenceTv/theme/tokens';
import { describeFoundSubtitle } from '@ValenceClient/library/describeFoundSubtitle';
import { useSubtitleSearch } from '@ValenceClient/library/useSubtitleSearch';
import { languageName } from '@ValenceClient/playback/languageName';
import type { SubtitleSearchProps } from './SubtitleSearch.types';
import { say } from '@ValenceI18n/say';

/**
 * Looking on the subtitle sites for subtitles to a film or episode while it plays, in the panel the
 * player's choices open in: the language to look in at the head, which opens a list of languages
 * of its own that Menu leaves, then what was found in it, best match first, each saying how well it
 * fits the file and why. Taking one has the server fetch and keep it for every app, and hands it
 * back to be switched on without starting again.
 *
 * @param mediaId - What is playing.
 * @param tracks - The subtitle tracks it has now, or nothing where they are not read yet.
 * @param onFound - Told the title's tracks once one is taken, and which of them is new.
 */
const SubtitleSearch = ({ mediaId, tracks, onFound }: SubtitleSearchProps) => {
  const search = useSubtitleSearch(mediaId, tracks, true);
  const [isChoosingLanguage, setIsChoosingLanguage] = useState(false);
  const { found } = search;
  const backToResults = useCallback(() => {
    setIsChoosingLanguage(false);
  }, []);

  useMenuButton(isChoosingLanguage ? backToResults : null, true);

  if (isChoosingLanguage) {
    return (
      <SidePanel title={say('common.language')}>
        {search.languages.map((one) => (
          <ActionRow
            key={one.code}
            label={one.label}
            {...(one.code === search.language ? { icon: Check } : {})}
            hasPreferredFocus={one.code === search.language}
            onPress={() => {
              search.choose(one.code);
              setIsChoosingLanguage(false);
            }}
          />
        ))}
      </SidePanel>
    );
  }

  return (
    <SidePanel title={say('screens.findSubtitlesDialog.findSubtitles')}>
      <ActionRow
        label={say('common.language')}
        detail={languageName(search.language)}
        hasPreferredFocus
        onPress={() => {
          setIsChoosingLanguage(true);
        }}
      />

      {found.isError ? (
        <>
          <Text style={styles.note}>
            {say('screens.findSubtitlesDialog.theSubtitleSitesCouldNotBe')}
          </Text>
          <ActionRow
            label={say('common.tryAgain')}
            onPress={() => {
              void found.refetch();
            }}
          />
        </>
      ) : found.data === undefined ? (
        <View style={styles.waiting}>
          <ActivityIndicator color={tokens.colours.muted} />
          <Text style={styles.waitingWords}>{say('screens.findSubtitlesDialog.looking')}</Text>
        </View>
      ) : !found.data.isSetUp ? (
        <Text style={styles.note}>{say('screens.findSubtitlesDialog.noSubtitleSiteIsSetUp')}</Text>
      ) : found.data.subtitles.length === 0 ? (
        <Text style={styles.note}>
          {say('screens.findSubtitlesDialog.nothingWasFoundInThatLanguage')}
        </Text>
      ) : (
        found.data.subtitles.map((subtitle) => {
          const key = `${subtitle.source}:${subtitle.id}`;

          return (
            <ActionRow
              key={key}
              label={subtitle.name}
              detail={
                search.taking === key ? say('common.inProgress') : describeFoundSubtitle(subtitle)
              }
              isDisabled={search.taking !== null}
              onPress={() => {
                if (search.taking !== null) {
                  return;
                }

                void search.take(subtitle).then((kept) => {
                  if (kept?.kind === 'kept') {
                    onFound(kept.tracks, kept.fresh);
                  }
                });
              }}
            />
          );
        })
      )}

      {search.problem === null ? null : <Text style={styles.problem}>{search.problem}</Text>}
    </SidePanel>
  );
};

SubtitleSearch.displayName = 'SubtitleSearch';

const styles = StyleSheet.create({
  note: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
  },
  problem: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.sm,
  },
  waiting: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
  },
  waitingWords: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

export { SubtitleSearch };
