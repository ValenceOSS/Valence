import { Picker, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import type { APageSettingsProps } from './APageSettings.types';
import { say } from '@ValenceI18n/say';

const SURROUNDS = ['edge', 'black', 'grey', 'white'] as const;

/**
 * The page reader's settings, as sections of the reader's sheet: which way the pages turn and how
 * many show at once as segmented controls, the cover's pairing as a switch, the colour round the
 * page, and whether a tap on either side turns it.
 *
 * @param isRightToLeft - Whether the pages turn right to left.
 * @param onRightToLeft - Told which way the pages should turn; without it a book is read left to
 *   right and the choice is not offered, which is everything but manga.
 * @param layout - How many pages show at once, or nothing where the phone decides that itself.
 * @param onLayout - Told how many pages should show at once.
 * @param isCoverAlone - Whether the cover sits on its own.
 * @param onCoverAlone - Told whether the cover should sit on its own.
 * @param isTapToTurn - Whether a tap on either side of the page turns it.
 * @param onTapToTurn - Told whether a tap on either side should turn the page.
 * @param surround - The colour round the page: its own edge's, or one chosen.
 * @param onSurround - Told which colour to put round the page.
 */
const APageSettings = ({
  isRightToLeft,
  onRightToLeft,
  layout,
  onLayout,
  isCoverAlone,
  onCoverAlone,
  isTapToTurn,
  onTapToTurn,
  surround,
  onSurround,
}: APageSettingsProps) => (
  <>
    {onRightToLeft === undefined ? null : (
      <Section
        title={say('common.readingDirection')}
        footer={<Text>{say('phone.aReader.aReaderSheet.mangaIsUsuallyReadRightTo')}</Text>}
      >
        <Picker
          selection={isRightToLeft ? 'rightToLeft' : 'leftToRight'}
          onSelectionChange={(chosen) => {
            onRightToLeft(chosen === 'rightToLeft');
          }}
          modifiers={[pickerStyle('segmented')]}
        >
          <Text modifiers={[tag('leftToRight')]}>{say('common.leftToRight')}</Text>
          <Text modifiers={[tag('rightToLeft')]}>{say('common.rightToLeft')}</Text>
        </Picker>
      </Section>
    )}

    <Section
      title={say('phone.aReader.aReaderSheet.pagesAtOnce')}
      footer={
        <Text>
          {layout === null
            ? say('phone.aReader.aReaderSheet.openThePhoneOutToRead')
            : say('phone.aReader.aReaderSheet.twoPagesAtOnceTurnsThe')}
        </Text>
      }
    >
      {layout === null ? null : (
        <Picker
          selection={layout}
          onSelectionChange={(chosen) => {
            onLayout(chosen === 'two' ? 'two' : 'one');
          }}
          modifiers={[pickerStyle('segmented')]}
        >
          <Text modifiers={[tag('one')]}>{say('phone.aReader.aReaderSheet.onePage')}</Text>
          <Text modifiers={[tag('two')]}>{say('phone.aReader.aReaderSheet.twoPages')}</Text>
        </Picker>
      )}
      <Toggle label={say('common.coverOnItsOwn')} isOn={isCoverAlone} onIsOnChange={onCoverAlone} />
    </Section>

    <Section
      title={say('phone.aReader.aReaderSheet.aroundThePage')}
      footer={<Text>{say('phone.aReader.aReaderSheet.autoTakesTheColourOfEach')}</Text>}
    >
      <Picker
        selection={surround}
        onSelectionChange={(chosen) => {
          const picked = SURROUNDS.find((one) => one === chosen);

          if (picked !== undefined) {
            onSurround(picked);
          }
        }}
        modifiers={[pickerStyle('segmented')]}
      >
        <Text modifiers={[tag('edge')]}>{say('common.auto')}</Text>
        <Text modifiers={[tag('black')]}>{say('common.black')}</Text>
        <Text modifiers={[tag('grey')]}>{say('common.grey')}</Text>
        <Text modifiers={[tag('white')]}>{say('common.white')}</Text>
      </Picker>
    </Section>

    <Section
      title={say('phone.aReader.aReaderSheet.turningPages')}
      footer={<Text>{say('phone.aReader.aReaderSheet.aTapInTheMiddleAlways')}</Text>}
    >
      <Toggle
        label={say('phone.aReader.aReaderSheet.tapTheSidesToTurn')}
        isOn={isTapToTurn}
        onIsOnChange={onTapToTurn}
      />
    </Section>
  </>
);

APageSettings.displayName = 'APageSettings';

export { APageSettings };
