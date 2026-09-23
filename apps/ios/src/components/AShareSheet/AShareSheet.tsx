import { useState } from 'react';
import { Share as ShareIcon } from '@keyline-icons/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Share, StyleSheet, View } from 'react-native';
import { createShare, shareAddress } from '@ValenceClient/sharing/fetchShares';
import { SHARE_CAPS } from '@ValenceClient/sharing/SHARE_CAPS';
import { SHARE_LASTS } from '@ValenceClient/sharing/SHARE_LASTS';
import { newShareFor } from '@ValenceClient/sharing/newShareFor';
import { shareQueries } from '@ValenceClient/query/shareQueries';
import { ASheet } from '@ValencePhone/components/ASheet/ASheet';
import { Button } from '@ValencePhone/components/Button/Button';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValencePhone/components/Words/Words';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import type { AShareSheetProps } from './AShareSheet.types';

const WHAT = [
  { id: 'item', label: 'Just this episode' },
  { id: 'series', label: 'The whole programme' },
] as const;

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
      setRefusal('That could not be shared. You may not have permission to hand out links.');

      return;
    }

    void cache.invalidateQueries({ queryKey: shareQueries.key });
    setLink(shareAddress(made.token, onThisServer('')));
  };

  return (
    <ASheet isOpen={subject !== null} title={`Share ${named}`} onClose={onClose}>
      {link === null ? (
        <>
          {isEpisode ? (
            <View style={styles.choice}>
              <Words size="heading">What to share</Words>
              <SegmentedRow label="What to share" items={WHAT} value={what} onSelect={setWhat} />
            </View>
          ) : null}

          <View style={styles.choice}>
            <Words size="heading">Lasts</Words>
            <SegmentedRow
              label="How long the link lasts"
              items={SHARE_LASTS}
              value={lasts}
              onSelect={setLasts}
            />
          </View>

          <View style={styles.choice}>
            <Words size="heading">Who can open it</Words>
            <SegmentedRow
              label="How many people can open it"
              items={SHARE_CAPS}
              value={cap}
              onSelect={setCap}
            />
            <Words size="small" tone="muted">
              Whichever runs out first ends the link.
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
            Make a link
          </Button>
        </>
      ) : (
        <>
          <Words tone="muted">This link is shown only once. Share or copy it now.</Words>
          <Words isSelectable>{link}</Words>
          <Button
            isWide
            icon={ShareIcon}
            onPress={() => {
              void Share.share({ url: link, message: link });
            }}
          >
            Share the link
          </Button>
        </>
      )}
    </ASheet>
  );
};

AShareSheet.displayName = 'AShareSheet';

export { AShareSheet };
