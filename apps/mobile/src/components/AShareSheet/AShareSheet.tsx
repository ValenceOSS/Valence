import { useState } from 'react';
import { Share as ShareIcon } from '@keyline-icons/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Share, StyleSheet, View } from 'react-native';
import { createShare, shareAddress } from '@ValenceClient/sharing/fetchShares';
import { SHARE_CAPS } from '@ValenceClient/sharing/SHARE_CAPS';
import { SHARE_LASTS } from '@ValenceClient/sharing/SHARE_LASTS';
import { newShareFor } from '@ValenceClient/sharing/newShareFor';
import { shareQueries } from '@ValenceClient/query/shareQueries';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { say } from '@ValenceI18n/say';
import type { AShareSheetProps } from './AShareSheet.types';
import type { StringKey } from '@ValenceI18n/StringKey';

const WHAT = [
  { id: 'item', said: 'phone.aShareSheet.justThisEpisode' },
  { id: 'series', said: 'phone.aShareSheet.wholeProgramme' },
] as const satisfies readonly { id: string; said: StringKey }[];

const styles = StyleSheet.create({
  choice: { gap: 8 },
});

/**
 * Hands out a link to a film, an episode, a programme or a book, as the web's share dialog does:
 * how long it lasts and how many people may open it are chosen together — whichever runs out first
 * ends it — and an episode can be shared alone or as its whole programme.
 *
 * The link is shown once, since the server keeps only a hash of it, and handed to the phone's own
 * share sheet, which sends it by message or copies it.
 *
 * @param subject - What is being shared, or nothing while the sheet is put away.
 * @param onClose - Told to put it away.
 */
const AShareSheet = ({ subject, onClose }: AShareSheetProps) => {
  const cache = useQueryClient();
  const [held, setHeld] = useState(subject);
  const [lasts, setLasts] = useState('7');
  const [cap, setCap] = useState('any');
  const [what, setWhat] = useState('item');
  const [link, setLink] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  if (held !== subject) {
    setHeld(subject);
    setLink(null);
    setRefusal(null);
    setWhat('item');
  }

  const isEpisode = subject?.kind === 'item' && subject.media.seriesId !== null;
  const named =
    subject === null
      ? ''
      : subject.kind === 'series'
        ? subject.title
        : subject.kind === 'book'
          ? subject.book.title
          : (subject.media.seriesTitle ?? subject.media.title);

  /**
   * Asks the server for the link.
   */
  const make = async () => {
    if (subject === null) {
      return;
    }

    setIsWorking(true);
    setRefusal(null);

    const made = await createShare(
      newShareFor(subject, { lasts, cap, isWholeProgramme: what === 'series' }, Date.now()),
    );

    setIsWorking(false);

    if (made === null) {
      setRefusal(say('phone.aShareSheet.refused'));

      return;
    }

    void cache.invalidateQueries({ queryKey: shareQueries.key });
    setLink(shareAddress(made.token, onThisServer('')));
  };

  return (
    <ASheet
      isOpen={subject !== null}
      title={say('phone.aShareSheet.title', { title: named })}
      onClose={onClose}
    >
      {link === null ? (
        <>
          {isEpisode ? (
            <View style={styles.choice}>
              <Words size="heading">{say('phone.aShareSheet.whatToShare')}</Words>
              <SegmentedRow
                label={say('phone.aShareSheet.whatToShare')}
                items={WHAT.map((one) => ({ id: one.id, label: say(one.said) }))}
                value={what}
                onSelect={setWhat}
              />
            </View>
          ) : null}

          <View style={styles.choice}>
            <Words size="heading">{say('phone.aShareSheet.lasts')}</Words>
            <SegmentedRow
              label={say('phone.aShareSheet.lastsLabel')}
              items={SHARE_LASTS}
              value={lasts}
              onSelect={setLasts}
            />
          </View>

          <View style={styles.choice}>
            <Words size="heading">{say('phone.aShareSheet.whoCanOpen')}</Words>
            <SegmentedRow
              label={say('phone.aShareSheet.whoCanOpenLabel')}
              items={SHARE_CAPS}
              value={cap}
              onSelect={setCap}
            />
            <Words size="small" tone="muted">
              {say('phone.aShareSheet.whicheverFirst')}
            </Words>
          </View>

          {refusal === null ? null : <Words tone="danger">{refusal}</Words>}

          <Button
            isWide
            isBusy={isWorking}
            onPress={() => {
              void make();
            }}
          >
            {say('phone.aShareSheet.makeALink')}
          </Button>
        </>
      ) : (
        <>
          <Words tone="muted">{say('phone.aShareSheet.shownOnce')}</Words>
          <Words isSelectable>{link}</Words>
          <Button
            isWide
            icon={ShareIcon}
            onPress={() => {
              void Share.share({ url: link, message: link });
            }}
          >
            {say('phone.aShareSheet.shareTheLink')}
          </Button>
        </>
      )}
    </ASheet>
  );
};

AShareSheet.displayName = 'AShareSheet';

export { AShareSheet };
