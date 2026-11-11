import { useContext, useState } from 'react';
import { Check, ChevronDown } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { describeCredit } from '@ValenceClient/people/describeCredit';
import { opensFromTheTimeline } from '@ValenceClient/people/opensFromTheTimeline';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { GROUND } from '@ValenceMobile/theme/GROUND';
import { theColours } from '@ValenceMobile/theme/theColours';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { APersonTimelineProps } from './APersonTimeline.types';
import { say } from '@ValenceI18n/say';

const SHOWN_AT_FIRST = 6;

const MARK = 20;

const MARK_ROOM = 24;

const LINE_CLEAR = 4;

const SUCCESS = '#3f9a4f';

const BRIGHT_SUCCESS = '#5fd27a';

const styles = StyleSheet.create({
  credit: { alignItems: 'center', flexDirection: 'row', gap: 16, minHeight: 56 },
  line: { flex: 1, width: 1 },
  mark: {
    alignItems: 'center',
    borderRadius: MARK / 2,
    borderWidth: 1.5,
    height: MARK,
    justifyContent: 'center',
    marginVertical: LINE_CLEAR + (MARK_ROOM - MARK) / 2,
    width: MARK,
  },
  more: { alignItems: 'center', flexDirection: 'row', gap: 16, minHeight: 44 },
  moreMark: { alignItems: 'center', justifyContent: 'center', width: MARK_ROOM },
  rail: { alignItems: 'center', alignSelf: 'stretch', width: MARK_ROOM },
  whole: { gap: 14 },
  words: { flex: 1, gap: 2, paddingVertical: 6 },
});

/**
 * Everything the catalogue credits somebody with, newest first, drawn as the web's step trail draws
 * it: a mark for each, ringed in dashes where the title is not on this server and ticked in green
 * where it is, a thin line joining each mark to the next, green below one that is here, the title
 * and how they were credited on it beside the mark, and the year at the far right. The first six
 * show until Show more is pressed. Where somebody may ask for things, pressing one opens the page to
 * ask for it, or its page here where it is already here; one of a kind the server takes no requests
 * for, and that is not here, does not open.
 *
 * @param credits - The credits, newest first.
 * @param onAsk - Told to open a title, for whoever may ask for things.
 */
const APersonTimeline = ({ credits, onAsk }: APersonTimelineProps) => {
  const colours = useTheColours();
  const ground = useContext(GROUND);
  const [isAll, setIsAll] = useState(false);
  const kinds = useRequestableKinds();
  const success =
    ground !== null || colours.surface === theColours.dark.surface ? BRIGHT_SUCCESS : SUCCESS;
  const line = withAlpha(colours.text, 0.14);
  const done = withAlpha(success, 0.5);

  if (credits.length === 0) {
    return null;
  }

  const shown = isAll ? credits : credits.slice(0, SHOWN_AT_FIRST);

  return (
    <View style={styles.whole}>
      <Words size="lead" isStrong>
        {say('common.timeline')}
      </Words>
      <View>
        {shown.map((credit, at) => {
          const detail = describeCredit(credit);
          const isHere = credit.standing.status === 'library';
          const wasHere = shown[at - 1]?.standing.status === 'library';
          const row = (
            <View style={styles.credit}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.line,
                    { backgroundColor: at === 0 ? 'transparent' : wasHere ? done : line },
                  ]}
                />
                <View
                  style={[
                    styles.mark,
                    isHere
                      ? { backgroundColor: withAlpha(success, 0.06), borderColor: success }
                      : { borderColor: colours.textMuted, borderStyle: 'dashed', opacity: 0.55 },
                  ]}
                >
                  {isHere ? <Icon of={Check} size={12} colour={success} /> : null}
                </View>
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        at === shown.length - 1 ? 'transparent' : isHere ? done : line,
                    },
                  ]}
                />
              </View>
              <View style={styles.words}>
                <Words lines={2} colour={withAlpha(colours.text, 0.8)}>
                  {credit.title}
                </Words>
                {detail === undefined ? null : (
                  <Words tone="muted" lines={1}>
                    {detail}
                  </Words>
                )}
              </View>
              {credit.year === null ? null : <Words tone="muted">{credit.year.toString()}</Words>}
            </View>
          );

          return onAsk === undefined || !opensFromTheTimeline(credit, kinds) ? (
            <View key={`${credit.kind}:${credit.id}`}>{row}</View>
          ) : (
            <Button
              key={`${credit.kind}:${credit.id}`}
              tone="bare"
              label={credit.title}
              onPress={() => {
                onAsk(credit.kind, credit.id);
              }}
            >
              {row}
            </Button>
          );
        })}

        {isAll || credits.length <= SHOWN_AT_FIRST ? null : (
          <Button
            tone="bare"
            label={say('common.showMore')}
            onPress={() => {
              setIsAll(true);
            }}
          >
            <View style={styles.more}>
              <View style={styles.moreMark}>
                <Icon of={ChevronDown} size={16} colour={colours.textMuted} />
              </View>
              <Words tone="muted">{say('common.showMore')}</Words>
            </View>
          </Button>
        )}
      </View>
    </View>
  );
};

APersonTimeline.displayName = 'APersonTimeline';

export { APersonTimeline };
