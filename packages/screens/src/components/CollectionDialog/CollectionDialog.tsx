import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ImagePlus as ImagePlusIcon,
  Layers as LayersIcon,
  MoreHorizontal as MoreHorizontalIcon,
  X as XIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Image as ImageFilledIcon,
  SquarePen as SquarePenFilledIcon,
  ArrowLeft as ArrowLeftFilledIcon,
  ArrowRight as ArrowRightFilledIcon,
  Minus as MinusFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { ReadMore } from '@ValenceUI/ReadMore';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Skeleton } from '@ValenceUI/Skeleton';
import { notify } from '@ValenceUI/notify';
import {
  dropCollectionArtwork,
  dropFromCollection,
  moveInCollection,
  removeCollection,
  saveCollectionArtwork,
} from '@ValenceClient/collections/fetchCollections';
import { arrangeCollection } from '@ValenceClient/collections/arrangeCollection';
import { whereAnEntryLands } from '@ValenceClient/music/whereAnEntryLands';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { CollectionCover } from '@ValenceScreens/components/CollectionCover/CollectionCover';
import { CollectionEditDialog } from '@ValenceScreens/components/CollectionEditDialog/CollectionEditDialog';
import { DialogHeadline } from '@ValenceScreens/components/DialogHeadline/DialogHeadline';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { RailCard } from '@ValenceScreens/components/RailCard/RailCard';
import { CollectionOrderSchema } from '@ValenceContracts/schemas/Collection';
import type { CollectionOrder } from '@ValenceContracts/schemas/Collection';
import type { CollectionDialogProps } from './CollectionDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const PICTURES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

/**
 * One collection in full: its cover, what it gathers, and every film and programme in it this viewer
 * may see, laid out as whoever made it placed them, by year, or by name.
 *
 * Somebody who may edit the libraries can also look after it from here — rename it and say what it
 * is, say whether its order matters, give it artwork of its own or take that away, move a title
 * earlier or later while it is laid out as placed, take a title out, and delete it, which leaves
 * everything that was in it where it is.
 *
 * @param collectionId - Which collection to open, or null while none is open.
 * @param onClose - Told when the dialog was dismissed.
 * @param onPlay - Told to start something in it, and where from.
 * @param onInspect - Told to open the page about a film in it.
 * @param onOpenShow - Told to open a programme in it.
 */
const CollectionDialog = ({
  collectionId,
  onClose,
  onPlay,
  onInspect,
  onOpenShow,
}: CollectionDialogProps) => {
  const cache = useQueryClient();
  const { may } = useWhatIMayDo();
  const mayManage = may('library.edit');
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [order, setOrder] = useState<CollectionOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSendingArtwork, setIsSendingArtwork] = useState(false);

  const shown = collectionId ?? lastOpened;
  const asked = useQuery({ ...collectionQueries.one(shown ?? ''), enabled: shown !== null });

  useEffect(() => {
    if (collectionId !== null) {
      setLastOpened(collectionId);
      setOrder(null);
    }
  }, [collectionId]);

  if (shown === null) {
    return null;
  }

  const refresh = () => {
    void cache.invalidateQueries({ queryKey: collectionQueries.key });
  };

  const detail = asked.data;
  const collection = detail?.collection ?? null;
  const arrangement = order ?? (collection?.isOrdered === true ? 'position' : 'year');
  const entries = detail === undefined ? [] : arrangeCollection(detail.entries, arrangement);
  const placed = detail?.entries.map((entry) => entry.id) ?? [];
  const mayReorder = mayManage && arrangement === 'position' && collection?.isOrdered === true;
  const label = collection?.name ?? say('common.collection');

  const move = (from: number, to: number) => {
    const entry = detail?.entries[from];

    if (collection !== null && entry !== undefined) {
      void moveInCollection(collection.id, entry.id, whereAnEntryLands(placed, from, to)).then(
        refresh,
      );
    }
  };

  return (
    <Dialog label={label} isOpen={collectionId !== null} onClose={onClose} size="stage">
      <DialogContent className="p-0">
        <div className="absolute right-4 top-4 z-10">
          <Button isIconOnly variant="overlay" label={say('common.close')} onClick={onClose}>
            <Icon of={XIcon} size={18} />
          </Button>
        </div>

        <DialogSections key={shown} className="flex flex-col gap-6 p-5 pb-10 sm:p-8">
          {asked.isError ? (
            <CouldNotRead
              said={say('common.thisCollectionCouldNotBeRead')}
              isTryingAgain={asked.isFetching}
              onTryAgain={() => {
                void asked.refetch();
              }}
            />
          ) : null}

          {collection === null ? (
            asked.isError ? null : (
              <div aria-hidden className="flex items-start gap-5">
                <Skeleton className="aspect-[2/3] w-32" />
                <span className="flex flex-1 flex-col gap-3">
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </span>
              </div>
            )
          ) : (
            <DialogHeadline className="flex flex-wrap items-end gap-5 pr-12">
              <DialogHeadlinePart as="span" className="block w-28 shrink-0 sm:w-36">
                <CollectionCover collection={collection} className="w-full" />
              </DialogHeadlinePart>

              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <DialogHeadlinePart as="span" className="text-xs font-semibold text-text-muted">
                  {say('common.collection')}
                </DialogHeadlinePart>

                <DialogHeadlinePart
                  as="h2"
                  isTitle
                  className="text-3xl font-semibold tracking-[-0.02em] text-text"
                >
                  {collection.name}
                </DialogHeadlinePart>

                <DialogHeadlinePart as="span" className="font-body text-sm text-text-muted">
                  {collection.isOrdered
                    ? say('common.countTitlesInOrder', {
                        count: sayCount('common.count.titles', collection.entryCount),
                      })
                    : sayCount('common.count.titles', collection.entryCount)}
                </DialogHeadlinePart>

                {mayManage ? (
                  <DialogHeadlinePart as="span" className="flex flex-wrap items-center gap-2 pt-1">
                    <FilePicker
                      label={say('screens.collectionDialog.chooseArtwork')}
                      accept={PICTURES}
                      variant="secondary"
                      size="sm"
                      isLoading={isSendingArtwork}
                      onPick={(file) => {
                        setIsSendingArtwork(true);
                        void saveCollectionArtwork(collection.id, file).then((wrong) => {
                          setIsSendingArtwork(false);
                          refresh();

                          if (wrong === null) {
                            notify.worked(
                              say('screens.collectionDialog.nameHasNewArtwork', {
                                name: collection.name,
                              }),
                            );
                          } else {
                            notify.failed(wrong);
                          }
                        });
                      }}
                    >
                      <Icon of={ImagePlusIcon} size={16} />
                      {say('screens.collectionDialog.chooseArtwork')}
                    </FilePicker>

                    <ActionMenu
                      label={say('common.moreForName', { name: collection.name })}
                      trigger={<Icon of={MoreHorizontalIcon} size={18} />}
                      groups={[
                        {
                          items: [
                            {
                              id: 'edit',
                              label: say('common.editDetails'),
                              icon: <Icon of={SquarePenFilledIcon} size={16} />,
                              onChoose: () => {
                                setIsEditing(true);
                              },
                            },
                            ...(collection.hasOwnArtwork
                              ? [
                                  {
                                    id: 'artwork',
                                    label: say('screens.collectionDialog.useThePostersInIt'),
                                    icon: <Icon of={ImageFilledIcon} size={16} />,
                                    onChoose: () => {
                                      void dropCollectionArtwork(collection.id).then(refresh);
                                    },
                                  },
                                ]
                              : []),
                            {
                              id: 'delete',
                              label: say('screens.collectionDialog.deleteCollection'),
                              icon: <Icon of={BinFilledIcon} size={16} />,
                              isDestructive: true,
                              onChoose: () => {
                                setIsRemoving(true);
                              },
                            },
                          ],
                        },
                      ]}
                    />
                  </DialogHeadlinePart>
                ) : null}
              </span>
            </DialogHeadline>
          )}

          {collection?.description === null || collection?.description === undefined ? null : (
            <ReadMore lines={4}>{collection.description}</ReadMore>
          )}

          {detail === undefined || detail.entries.length === 0 ? null : (
            <SegmentedRow
              label={say('common.arrangeIt')}
              size="sm"
              className="self-start"
              value={arrangement}
              items={[
                ...(collection?.isOrdered === true
                  ? [{ id: 'position', label: say('common.itsOwnOrder') }]
                  : []),
                { id: 'year', label: say('common.byYear') },
                { id: 'title', label: say('common.byName') },
              ]}
              onSelect={(id) => {
                const chosen = CollectionOrderSchema.safeParse(id);

                if (chosen.success) {
                  setOrder(chosen.data);
                }
              }}
            />
          )}

          {detail !== undefined && detail.entries.length === 0 ? (
            <NothingHere
              of={LayersIcon}
              title={say('common.nothingInThisCollectionYet')}
              {...(mayManage
                ? { detail: say('screens.collectionDialog.addFilmsAndProgrammesFromTheir') }
                : {})}
            />
          ) : null}

          {entries.length === 0 ? null : (
            <ul
              aria-label={label}
              className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-4 gap-y-6"
            >
              {entries.map((entry, at) => (
                <li key={entry.id} className="flex min-w-0 flex-col gap-1">
                  <RailCard
                    media={entry.media}
                    shape="poster"
                    isSeries={entry.kind === 'series'}
                    onPlay={onPlay}
                    onInspect={onInspect}
                    onOpenShow={onOpenShow}
                  />

                  {mayManage && collection !== null ? (
                    <span className="flex flex-wrap items-center gap-1">
                      {mayReorder && at > 0 ? (
                        <PanelCardAction
                          icon={ArrowLeftFilledIcon}
                          onClick={() => {
                            move(at, at - 1);
                          }}
                        >
                          {say('screens.collectionDialog.earlier')}
                        </PanelCardAction>
                      ) : null}

                      {mayReorder && at < entries.length - 1 ? (
                        <PanelCardAction
                          icon={ArrowRightFilledIcon}
                          onClick={() => {
                            move(at, at + 1);
                          }}
                        >
                          {say('screens.collectionDialog.later')}
                        </PanelCardAction>
                      ) : null}

                      <PanelCardAction
                        icon={MinusFilledIcon}
                        onClick={() => {
                          void dropFromCollection(collection.id, entry.id).then(refresh);
                        }}
                      >
                        {say('common.remove')}
                      </PanelCardAction>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </DialogSections>
      </DialogContent>

      {mayManage && collection !== null ? (
        <>
          <CollectionEditDialog
            isOpen={isEditing}
            collection={collection}
            onClose={() => {
              setIsEditing(false);
            }}
          />

          <ConfirmDialog
            isOpen={isRemoving}
            title={say('common.deleteName', { name: collection.name })}
            detail={say('screens.collectionDialog.theFilmsAndProgrammesInIt')}
            confirmLabel={say('common.delete')}
            isDestructive
            onClose={() => {
              setIsRemoving(false);
            }}
            onConfirm={() => {
              void removeCollection(collection.id).then((removed) => {
                setIsRemoving(false);
                refresh();

                if (removed) {
                  onClose();
                } else {
                  notify.failed(say('screens.collectionDialog.thatCollectionCouldNotBeDeleted'));
                }
              });
            }}
          />
        </>
      ) : null}
    </Dialog>
  );
};

CollectionDialog.displayName = 'CollectionDialog';

export { CollectionDialog };
