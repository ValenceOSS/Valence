import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { describeStreamOffer } from '@ValenceClient/streams/describeStreamOffer';
import { groupStreamOffers } from '@ValenceClient/streams/groupStreamOffers';
import type { StreamGroupId } from '@ValenceClient/streams/groupStreamOffers';
import { ABadge } from '@ValenceMobile/components/ABadge/ABadge';
import { ABottomSheet } from '@ValenceMobile/components/ABottomSheet/ABottomSheet';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { AChooseSourceSheetProps } from './AChooseSourceSheet.types';

const MOST_PER_GROUP = 8;

const styles = StyleSheet.create({
  group: { gap: 6 },
  heading: { paddingHorizontal: 4 },
  row: { borderRadius: 14, gap: 2, paddingHorizontal: 14, paddingVertical: 12 },
  summary: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  waiting: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  whole: { gap: 16 },
});

/**
 * Which stream to play a film from, as the web's source picker offers it: each source's streams
 * under the resolution they are, the one Valence would choose marked, each row saying its picture,
 * sound, size and where it comes from. Pressing a row plays it. Streams that have to download at
 * their service first are folded away beneath the ones that start straight away, unless none do.
 *
 * @param title - The film.
 * @param isOpen - Whether it is out.
 * @param offers - What the sources offer, once they have said.
 * @param isLooking - Whether the sources are still being asked.
 * @param isFailed - Whether asking failed altogether.
 * @param bestId - The stream Valence would choose.
 * @param isPlaying - Whether a choice is being started, which holds the rows.
 * @param problem - Why the stream chosen would not play, where it would not.
 * @param onTryAgain - Told to ask the sources again.
 * @param onChoose - Told the stream chosen.
 * @param onClose - Told to put it away.
 */
const AChooseSourceSheet = ({
  title,
  isOpen,
  offers,
  isLooking,
  isFailed,
  bestId,
  isPlaying,
  problem,
  onTryAgain,
  onChoose,
  onClose,
}: AChooseSourceSheetProps) => {
  const colours = useTheColours();
  const [isShowingLater, setIsShowingLater] = useState(false);
  const [shownMore, setShownMore] = useState<ReadonlySet<StreamGroupId>>(new Set());
  const found = offers?.offers ?? [];
  const { groups, isAnyReady, laterCount } = groupStreamOffers(found, isShowingLater);
  const problems = (offers?.problems ?? []).map((said) => said.message).join(' ');

  return (
    <ABottomSheet
      isOpen={isOpen}
      label={say('screens.chooseSourceDialog.sourcesForTitle', { title })}
      title={say('common.playName', { name: title })}
      onClose={onClose}
      isTall
    >
      <View style={styles.whole}>
        <Words size="small" tone="muted">
          {isAnyReady || found.length === 0
            ? say('screens.chooseSourceDialog.instantSourcesStartStraightAway')
            : say('screens.chooseSourceDialog.noneCanStartStraightAway')}
        </Words>

        {problem === null ? null : <Words tone="danger">{problem}</Words>}

        {isFailed ? (
          <View style={styles.waiting}>
            <Words tone="danger">{say('screens.chooseSourceDialog.couldNotLookForSources')}</Words>
            <Button tone="quiet" onPress={onTryAgain}>
              {say('common.tryAgain')}
            </Button>
          </View>
        ) : isLooking ? (
          <View style={styles.waiting}>
            <ASpinner colour={colours.textMuted} />
            <Words tone="muted">{say('screens.chooseSourceDialog.lookingForSources')}</Words>
          </View>
        ) : found.length === 0 ? (
          <View style={styles.waiting}>
            <Words isStrong>{say('screens.chooseSourceDialog.noSourcesFound')}</Words>
            <Words tone="muted" isCentred>
              {say('screens.chooseSourceDialog.noneOfTheSourcesHaveThis')}
            </Words>
            <Button tone="quiet" onPress={onTryAgain}>
              {say('common.tryAgain')}
            </Button>
          </View>
        ) : (
          groups.map((group) => {
            const shown = shownMore.has(group.id)
              ? group.offers
              : group.offers.slice(0, MOST_PER_GROUP);

            return (
              <View key={group.id} style={styles.group}>
                <View style={styles.heading}>
                  <Words size="small" tone="muted" isStrong>
                    {group.heading}
                  </Words>
                </View>

                {shown.map((offer) => {
                  const { summary, detail } = describeStreamOffer(offer);

                  return (
                    <Button
                      key={offer.id}
                      tone="bare"
                      label={
                        offer.id === bestId
                          ? `${say('screens.chooseSourceDialog.playSummaryFromSource', { summary, source: offer.sourceName })} · ${say('screens.chooseSourceDialog.bestMatch')}`
                          : say('screens.chooseSourceDialog.playSummaryFromSource', {
                              summary,
                              source: offer.sourceName,
                            })
                      }
                      isDisabled={isPlaying}
                      onPress={() => {
                        onChoose(offer.id);
                      }}
                    >
                      <View
                        style={[styles.row, { backgroundColor: withAlpha(colours.text, 0.06) }]}
                      >
                        <View style={styles.summary}>
                          <Words isStrong>{summary}</Words>
                          {offer.id === bestId ? (
                            <ABadge tone="accent">
                              {say('screens.chooseSourceDialog.bestMatch')}
                            </ABadge>
                          ) : null}
                        </View>
                        <Words size="small" tone="muted" lines={2}>
                          {detail}
                        </Words>
                      </View>
                    </Button>
                  );
                })}

                {group.offers.length > shown.length ? (
                  <Button
                    tone="ghost"
                    onPress={() => {
                      setShownMore(new Set([...shownMore, group.id]));
                    }}
                  >
                    {say('common.showMore')}
                  </Button>
                ) : null}
              </View>
            );
          })
        )}

        {laterCount > 0 && !isLooking && !isFailed ? (
          <Button
            tone="ghost"
            onPress={() => {
              setIsShowingLater(!isShowingLater);
            }}
          >
            {isShowingLater
              ? say('screens.chooseSourceDialog.hideSourcesThatDownloadFirst')
              : sayCount(
                  'screens.chooseSourceDialog.count.showSourcesThatDownloadFirst',
                  laterCount,
                )}
          </Button>
        ) : null}

        {problems === '' ? null : (
          <Words size="small" tone="muted">
            {problems}
          </Words>
        )}
      </View>
    </ABottomSheet>
  );
};

AChooseSourceSheet.displayName = 'AChooseSourceSheet';

export { AChooseSourceSheet };
