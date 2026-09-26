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
                title="Pages turn"
                footer={<Text>Manga is usually read right to left.</Text>}
              >
                <Picker
                  selection={isRightToLeft ? 'rightToLeft' : 'leftToRight'}
                  onSelectionChange={(chosen) => {
                    onRightToLeft(chosen === 'rightToLeft');
                  }}
                  modifiers={[pickerStyle('segmented')]}
                >
                  <Text modifiers={[tag('leftToRight')]}>Left to right</Text>
                  <Text modifiers={[tag('rightToLeft')]}>Right to left</Text>
                </Picker>
              </Section>

              <Section
                title="Pages at once"
                footer={
                  <Text>
                    {layout === null
                      ? 'Open the phone out to read two pages side by side.'
                      : 'Two pages at once turns the phone on its side.'}
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
                    <Text modifiers={[tag('one')]}>One page</Text>
                    <Text modifiers={[tag('two')]}>Two pages</Text>
                  </Picker>
                )}
                <Toggle label="Cover on its own" isOn={isCoverAlone} onIsOnChange={onCoverAlone} />
              </Section>

              <Section title="Chapters">
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
                <Button label="Done" onPress={onClose} />
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
