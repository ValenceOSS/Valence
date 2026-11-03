import { ChevronRight } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { APlayerList } from '@ValenceMobile/components/Watching/components/APlayerList/APlayerList';
import { APlayerPanel } from '@ValenceMobile/components/Watching/components/APlayerPanel/APlayerPanel';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { describeFoundSubtitle } from '@ValenceClient/library/describeFoundSubtitle';
import { useSubtitleSearch } from '@ValenceClient/library/useSubtitleSearch';
import { languageName } from '@ValenceClient/playback/languageName';
import type { TheSubtitleSearchProps } from './TheSubtitleSearch.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  language: {
    alignItems: 'center',
    borderBottomColor: PLAYER_LOOK.colours.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingVertical: 14,
  },
  languageLabel: { ...PLAYER_LOOK.styles.label, flex: 1 },
  list: { gap: 4, maxWidth: 560, paddingBottom: 24, paddingTop: 10 },
  note: { ...PLAYER_LOOK.styles.label, paddingTop: 18 },
  problem: { ...PLAYER_LOOK.styles.small, color: PLAYER_LOOK.colours.text, paddingTop: 12 },
  row: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  said: { flex: 1, gap: 2 },
  waiting: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingTop: 18 },
  whole: { flexGrow: 1, flexShrink: 1 },
});

/**
 * Looking on the subtitle sites for subtitles to a film or episode while it plays, as the web's
 * player does: the language to look in, which can be changed, then what was found in it, best match
 * first, each saying how well it fits the file and why. Taking one has the server fetch and keep it,
 * so every app has it from then on, and hands it back to be switched on without starting again.
 *
 * @param mediaId - What is playing.
 * @param tracks - The subtitle tracks it has now.
 * @param onFound - Told the title's tracks once one is taken, and which of them is new.
 * @param onClose - Told they are done looking.
 */
const TheSubtitleSearch = ({ mediaId, tracks, onFound, onClose }: TheSubtitleSearchProps) => {
  const search = useSubtitleSearch(mediaId, tracks, true);
  const [isChoosingLanguage, setIsChoosingLanguage] = useState(false);
  const { found } = search;

  return (
    <APlayerPanel label={say('phone.watching.closeAudioAndSubtitles')} onClose={onClose} isACard>
      {isChoosingLanguage ? (
        <APlayerList
          set={{
            heading: say('common.language'),
            chosen: search.language,
            choices: search.languages.map((one) => ({ id: one.code, label: one.label })),
            onChoose: (code) => {
              search.choose(code);
              setIsChoosingLanguage(false);
            },
          }}
        />
      ) : (
        <View style={styles.whole}>
          <Text style={PLAYER_LOOK.styles.heading}>
            {say('screens.findSubtitlesDialog.findSubtitles')}
          </Text>

          <Button
            tone="bare"
            label={say('common.language')}
            onPress={() => {
              setIsChoosingLanguage(true);
            }}
          >
            <View style={styles.language}>
              <Text style={styles.languageLabel}>{say('common.language')}</Text>
              <Text style={PLAYER_LOOK.styles.labelChosen}>{languageName(search.language)}</Text>
              <Icon of={ChevronRight} size={20} colour={PLAYER_LOOK.colours.quiet} />
            </View>
          </Button>

          {found.isError ? (
            <View>
              <Text style={styles.note}>
                {say('screens.findSubtitlesDialog.theSubtitleSitesCouldNotBe')}
              </Text>
              <Button
                tone="bare"
                label={say('common.tryAgain')}
                onPress={() => {
                  void found.refetch();
                }}
              >
                <Text style={[PLAYER_LOOK.styles.action, styles.note]}>
                  {say('common.tryAgain')}
                </Text>
              </Button>
            </View>
          ) : found.data === undefined ? (
            <View style={styles.waiting}>
              <ASpinner colour={PLAYER_LOOK.colours.quiet} />
              <Text style={PLAYER_LOOK.styles.label}>
                {say('screens.findSubtitlesDialog.looking')}
              </Text>
            </View>
          ) : !found.data.isSetUp ? (
            <Text style={styles.note}>
              {say('screens.findSubtitlesDialog.noSubtitleSiteIsSetUp')}
            </Text>
          ) : found.data.subtitles.length === 0 ? (
            <Text style={styles.note}>
              {say('screens.findSubtitlesDialog.nothingWasFoundInThatLanguage')}
            </Text>
          ) : (
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {found.data.subtitles.map((subtitle) => {
                const key = `${subtitle.source}:${subtitle.id}`;
                const detail = describeFoundSubtitle(subtitle);

                return (
                  <Button
                    key={key}
                    tone="bare"
                    label={`${subtitle.name}, ${detail}`}
                    isDisabled={search.taking !== null && search.taking !== key}
                    onPress={() => {
                      void search.take(subtitle).then((kept) => {
                        if (kept?.kind === 'kept') {
                          onFound(kept.tracks, kept.fresh);
                        }
                      });
                    }}
                  >
                    <View style={styles.row}>
                      <View style={styles.said}>
                        <Text style={PLAYER_LOOK.styles.labelChosen} numberOfLines={2}>
                          {subtitle.name}
                        </Text>
                        <Text style={PLAYER_LOOK.styles.small} numberOfLines={2}>
                          {detail}
                        </Text>
                      </View>

                      {search.taking === key ? (
                        <ASpinner
                          colour={PLAYER_LOOK.colours.text}
                          label={say('common.inProgress')}
                        />
                      ) : null}
                    </View>
                  </Button>
                );
              })}
            </ScrollView>
          )}

          {search.problem === null ? null : <Text style={styles.problem}>{search.problem}</Text>}
        </View>
      )}
    </APlayerPanel>
  );
};

TheSubtitleSearch.displayName = 'TheSubtitleSearch';

export { TheSubtitleSearch };
