import {
  BottomSheet,
  Button,
  Form,
  Group,
  HStack,
  Host,
  Image,
  NavigationStack,
  Picker,
  Section,
  Spacer,
  Text,
  Toggle,
  Toolbar,
  ToolbarItem,
} from '@expo/ui/swift-ui';
import {
  foregroundStyle,
  navigationTitle,
  pickerStyle,
  presentationDetents,
  presentationDragIndicator,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';
import type { AReaderSheetProps } from './AReaderSheet.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  anchor: { height: 1, left: 0, position: 'absolute', top: 0, width: 1 },
});

/**
 * The page reader's contents and settings as the system draws a sheet of settings: a grouped form
 * rising from the bottom, half the screen and pulled up to all of it, with which way the pages
 * turn and how many show at once as segmented controls, the cover's pairing as a switch, and the
 * chapters as a list with the open one ticked.
 *
 * @param isOpen - Whether the sheet is up.
 * @param onClose - Told it was put away.
 * @param title - What is being read.
 * @param isRightToLeft - Whether the pages turn right to left.
 * @param onRightToLeft - Told which way the pages should turn.
 * @param layout - How many pages show at once, or nothing where the phone decides that itself.
 * @param onLayout - Told how many pages should show at once.
 * @param isCoverAlone - Whether the cover sits on its own.
 * @param onCoverAlone - Told whether the cover should sit on its own.
 * @param chapters - The chapters, with the open one marked.
 * @param onChapter - Told which chapter to open.
 */
const AReaderSheet = ({
  isOpen,
  onClose,
  title,
  isRightToLeft,
  onRightToLeft,
  layout,
  onLayout,
  isCoverAlone,
  onCoverAlone,
  chapters,
  onChapter,
}: AReaderSheetProps) => (
  <Host style={styles.anchor} colorScheme="dark">
    <BottomSheet
      isPresented={isOpen}
      onIsPresentedChange={(isPresented) => {
        if (!isPresented) {
          onClose();
        }
      }}
    >
      <Group
        modifiers={[presentationDetents(['medium', 'large']), presentationDragIndicator('visible')]}
      >
        <NavigationStack>
          <Toolbar>
            <Form modifiers={[navigationTitle(title)]}>
              <Section
                title={say('phone.aReader.aReaderSheet.pagesTurn')}
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
                    <Text modifiers={[tag('one')]}>
                      {say('phone.aReader.aReaderSheet.onePage')}
                    </Text>
                    <Text modifiers={[tag('two')]}>
                      {say('phone.aReader.aReaderSheet.twoPages')}
                    </Text>
                  </Picker>
                )}
                <Toggle
                  label={say('common.coverOnItsOwn')}
                  isOn={isCoverAlone}
                  onIsOnChange={onCoverAlone}
                />
              </Section>

              <Section title={say('common.chapters')}>
                {chapters.map((chapter) => (
                  <Button
                    key={chapter.id}
                    onPress={() => {
                      onChapter(chapter.id);
                    }}
                  >
                    <HStack>
                      <Text
                        modifiers={[foregroundStyle({ type: 'hierarchical', style: 'primary' })]}
                      >
                        {chapter.label}
                      </Text>
                      <Spacer />
                      {chapter.isHere ? <Image systemName="checkmark" /> : null}
                    </HStack>
                  </Button>
                ))}
              </Section>
            </Form>
            <Toolbar.Content>
              <ToolbarItem placement="confirmationAction">
                <Button label={say('common.done')} onPress={onClose} />
              </ToolbarItem>
            </Toolbar.Content>
          </Toolbar>
        </NavigationStack>
      </Group>
    </BottomSheet>
  </Host>
);

AReaderSheet.displayName = 'AReaderSheet';

export { AReaderSheet };
