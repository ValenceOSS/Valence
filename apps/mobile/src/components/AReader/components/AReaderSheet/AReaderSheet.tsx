import { useState } from 'react';
import {
  BottomSheet,
  Button,
  Group,
  HStack,
  Host,
  Image,
  List,
  NavigationDestination,
  NavigationLink,
  NavigationStack,
  Section,
  Spacer,
  Text,
  Toolbar,
  ToolbarItem,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  foregroundStyle,
  listStyle,
  navigationBarTitleDisplayMode,
  navigationTitle,
  padding,
  presentationDetents,
  presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';
import { readableTitle } from '@ValenceCore/books/readableTitle';
import { ABookmarksPage } from '@ValenceMobile/components/AReader/components/AReaderSheet/components/ABookmarksPage/ABookmarksPage';
import type { AReaderSheetProps } from './AReaderSheet.types';
import { say } from '@ValenceI18n/say';

const INDENT = 16;

const BOOKMARKS = 'bookmarks';

const SLIDES_AWAY_MS = 400;

const styles = StyleSheet.create({
  anchor: { height: 1, left: 0, position: 'absolute', top: 0, width: 1 },
});

const PRIMARY = foregroundStyle({ type: 'hierarchical', style: 'primary' });

const SECONDARY = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

/**
 * A reader's contents and settings as the system draws a sheet of settings: a grouped list rising
 * from the bottom, half the screen and pulled up to all of it, holding the reader's look where it has
 * one, then a row leading to the book's bookmarks, then the reader's own settings, then its chapters
 * or contents with the open one ticked. The page reader and the text reader both use it, each with
 * its own settings.
 *
 * The bookmarks are a page of their own inside the sheet, pushed from their row as a settings page
 * is, so picking and removing them happens there and leaves the rest of the sheet where it was.
 * Choosing one puts the sheet away first and goes to it once the sheet has slid down, since going
 * there opens the reader afresh and would otherwise take the sheet with it mid-slide.
 *
 * @param isOpen - Whether the sheet is up.
 * @param onClose - Told it was put away.
 * @param title - What is being read.
 * @param look - The reader's look, as a section above the bookmarks, where it has one.
 * @param settings - The reader's own settings, as sections of the sheet.
 * @param placesAre - What the places are called: chapters, or contents.
 * @param places - The places, in order, with the open one marked.
 * @param onPlace - Told which place to go to.
 * @param bookmarks - The book's bookmarks, where it keeps them.
 * @param onBookmark - Told which bookmark to go to.
 * @param onRemoveBookmarks - Told which bookmarks to remove.
 */
const AReaderSheet = ({
  isOpen,
  onClose,
  title,
  look,
  settings,
  placesAre,
  places,
  onPlace,
  bookmarks,
  onBookmark,
  onRemoveBookmarks,
}: AReaderSheetProps) => {
  const [path, setPath] = useState<string[]>([]);

  /**
   * Puts the sheet away, back at its first page for next time.
   */
  const close = () => {
    setPath([]);
    onClose();
  };

  return (
    <Host style={styles.anchor} colorScheme="dark">
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(isPresented) => {
          if (!isPresented) {
            close();
          }
        }}
      >
        <Group
          modifiers={[
            presentationDetents(['medium', 'large']),
            presentationDragIndicator('visible'),
          ]}
        >
          <NavigationStack path={path} onPathChange={setPath}>
            <Toolbar>
              <List
                modifiers={[
                  navigationTitle(title),
                  navigationBarTitleDisplayMode('inline'),
                  listStyle('insetGrouped'),
                ]}
              >
                {look}

                {bookmarks === undefined ? null : (
                  <Section>
                    <NavigationLink value={BOOKMARKS}>
                      <HStack>
                        <Image systemName="bookmark" />
                        <Text modifiers={[PRIMARY]}>{say('common.bookmarks')}</Text>
                        <Spacer />
                        <Text modifiers={[SECONDARY]}>{bookmarks.length.toString()}</Text>
                      </HStack>
                    </NavigationLink>
                  </Section>
                )}

                {settings}

                {places.length < 2 ? null : (
                  <Section title={placesAre}>
                    {places.map((place) => (
                      <Button
                        key={place.id}
                        onPress={() => {
                          onPlace(place.id);
                        }}
                        modifiers={[buttonStyle('plain')]}
                      >
                        <HStack>
                          <Text modifiers={[PRIMARY, padding({ leading: place.depth * INDENT })]}>
                            {readableTitle(place.label)}
                          </Text>
                          <Spacer />
                          {place.isHere ? <Image systemName="checkmark" /> : null}
                        </HStack>
                      </Button>
                    ))}
                  </Section>
                )}
              </List>
              <Toolbar.Content>
                <ToolbarItem placement="confirmationAction">
                  <Button label={say('common.done')} onPress={close} />
                </ToolbarItem>
              </Toolbar.Content>
            </Toolbar>

            <NavigationDestination value={BOOKMARKS}>
              <ABookmarksPage
                bookmarks={bookmarks ?? []}
                onBookmark={(bookmarkId) => {
                  close();
                  setTimeout(() => {
                    onBookmark?.(bookmarkId);
                  }, SLIDES_AWAY_MS);
                }}
                onRemove={(bookmarkIds) => {
                  onRemoveBookmarks?.(bookmarkIds);
                }}
              />
            </NavigationDestination>
          </NavigationStack>
        </Group>
      </BottomSheet>
    </Host>
  );
};

AReaderSheet.displayName = 'AReaderSheet';

export { AReaderSheet };
