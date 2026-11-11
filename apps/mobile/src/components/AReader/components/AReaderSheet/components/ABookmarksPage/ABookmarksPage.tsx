import { useState } from 'react';
import {
  Button,
  ContentUnavailableView,
  HStack,
  List,
  RNHostView,
  Spacer,
  Text,
  Toolbar,
  ToolbarItem,
  VStack,
} from '@expo/ui/swift-ui';
import {
  Animation,
  animation,
  buttonStyle,
  deleteDisabled,
  disabled,
  environment,
  font,
  foregroundStyle,
  lineLimit,
  listStyle,
  navigationBarTitleDisplayMode,
  navigationTitle,
} from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import type { ABookmarksPageProps } from './ABookmarksPage.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const styles = StyleSheet.create({
  picture: { borderRadius: 4, height: 56, width: 40 },
});

const PRIMARY = foregroundStyle({ type: 'hierarchical', style: 'primary' });

const SECONDARY = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

const FOOTNOTE = font({ textStyle: 'footnote' });

/**
 * A book's bookmarks as a page of their own inside the reader's sheet, pushed from the Bookmarks row
 * at its top: the system's own list, each row going to its place when pressed and swiped away to
 * remove it, a full swipe removing it at once.
 *
 * Select in the bar puts the list into the system's editing, sliding a circle in beside each so
 * several can be picked; once any are, Remove beside it takes them all away, and Done ends it. What
 * is picked belongs to this page alone, so picking redraws nothing else in the sheet.
 *
 * @param bookmarks - The bookmarks, in the order they come in the book.
 * @param onBookmark - Told which bookmark to go to.
 * @param onRemove - Told which bookmarks to remove.
 */
const ABookmarksPage = ({ bookmarks, onBookmark, onRemove }: ABookmarksPageProps) => {
  const [isPicking, setIsPicking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const isSelecting = isPicking && isEditing && bookmarks.length > 0;
  const chosen = picked.filter((id) => bookmarks.some((bookmark) => bookmark.id === id));

  /**
   * Starts or stops picking bookmarks to remove. Deleting a row is switched off a frame before the
   * list is put into editing, and back on a frame after it leaves, so the system never shows a row's
   * delete control in between.
   *
   * @param isOn - Whether to pick.
   */
  const pick = (isOn: boolean) => {
    setPicked([]);

    if (isOn) {
      setIsPicking(true);
      requestAnimationFrame(() => {
        setIsEditing(true);
      });

      return;
    }

    setIsEditing(false);
    requestAnimationFrame(() => {
      setIsPicking(false);
    });
  };

  return (
    <Toolbar>
      {bookmarks.length === 0 ? (
        <ContentUnavailableView
          title={say('common.noBookmarksYet')}
          systemImage="bookmark"
          description={say('common.pagesYouBookmarkAppearHere')}
          modifiers={[
            navigationTitle(say('common.bookmarks')),
            navigationBarTitleDisplayMode('inline'),
          ]}
        />
      ) : (
        <List
          selection={[...chosen]}
          onSelectionChange={(now) => {
            setPicked(now.map(String));
          }}
          modifiers={[
            navigationTitle(say('common.bookmarks')),
            navigationBarTitleDisplayMode('inline'),
            listStyle('insetGrouped'),
            environment('editMode', isSelecting ? 'active' : 'inactive'),
            animation(Animation.default, isSelecting),
          ]}
        >
          <List.ForEach
            data={bookmarks}
            keyExtractor={(bookmark) => bookmark.id}
            recycling={false}
            onDelete={(indices) => {
              onRemove(
                indices.flatMap((at) => {
                  const gone = bookmarks[at];

                  return gone === undefined ? [] : [gone.id];
                }),
              );
            }}
          >
            {({ item: bookmark }) => {
              const row = (
                <HStack spacing={12}>
                  {bookmark.picture === null ? null : (
                    <RNHostView matchContents>
                      <View>
                        <ARemotePicture uri={bookmark.picture} style={styles.picture} />
                      </View>
                    </RNHostView>
                  )}
                  <VStack alignment="leading" spacing={4}>
                    <Text modifiers={[PRIMARY, lineLimit(3)]}>
                      {bookmark.excerpt ?? bookmark.place}
                    </Text>
                    {bookmark.excerpt === null ? null : (
                      <Text modifiers={[SECONDARY, FOOTNOTE]}>{bookmark.place}</Text>
                    )}
                    {bookmark.chapter === null ? null : (
                      <Text modifiers={[SECONDARY, FOOTNOTE, lineLimit(1)]}>
                        {bookmark.chapter}
                      </Text>
                    )}
                  </VStack>
                  <Spacer />
                </HStack>
              );

              return (
                <HStack modifiers={[deleteDisabled(isPicking)]}>
                  <Button
                    onPress={() => {
                      onBookmark(bookmark.id);
                    }}
                    modifiers={[buttonStyle('plain'), disabled(isSelecting)]}
                  >
                    {row}
                  </Button>
                </HStack>
              );
            }}
          </List.ForEach>
        </List>
      )}
      <Toolbar.Content>
        {isSelecting && chosen.length > 0 ? (
          <ToolbarItem placement="topBarTrailing">
            <Button
              role="destructive"
              label={sayCount('common.count.removeBookmarks', chosen.length)}
              onPress={() => {
                onRemove(chosen);
                pick(false);
              }}
            />
          </ToolbarItem>
        ) : null}
        {bookmarks.length === 0 ? null : (
          <ToolbarItem placement="topBarTrailing">
            <Button
              label={isPicking ? say('common.done') : say('common.select')}
              onPress={() => {
                pick(!isPicking);
              }}
            />
          </ToolbarItem>
        )}
      </Toolbar.Content>
    </Toolbar>
  );
};

ABookmarksPage.displayName = 'ABookmarksPage';

export { ABookmarksPage };
