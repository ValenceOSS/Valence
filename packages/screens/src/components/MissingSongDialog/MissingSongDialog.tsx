import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { AskableMusicTile } from '@ValenceScreens/components/RequestsPage/components/AskableMusicTile/AskableMusicTile';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { MissingSongDialogProps } from './MissingSongDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Finds the album a missing song is on, so it can be requested: the catalogue's albums for its
 * artist and its album, or its title where the playlist does not say the album, each shown with
 * where it stands. Choosing one opens the page for asking for it, as choosing an album anywhere else
 * does.
 *
 * @param song - The song, or nothing while the dialog is shut.
 * @param onClose - Told it was dismissed, or an album chosen.
 */
const MissingSongDialog = ({ song, onClose }: MissingSongDialogProps) => {
  const { go } = usePlace();
  const found = useQuery(
    requestsQueries.askableSearch(
      song === null ? '' : `${song.artist} ${song.album ?? song.title}`,
      'album',
      song !== null,
    ),
  );

  return (
    <Dialog label={say('common.requestItsAlbum')} isOpen={song !== null} onClose={onClose}>
      {song === null ? null : (
        <>
          <DialogTitle
            title={say('common.requestItsAlbum')}
            detail={say('common.titleByArtistIsNotInYourLibrary', {
              title: song.title,
              artist: song.artist,
            })}
          />

          <DialogContent className="flex flex-col gap-4">
            {found.data === undefined ? (
              <Spinner
                size="sm"
                label={say('screens.missingSongDialog.lookingForItsAlbum')}
                isCentered
              />
            ) : found.data.length === 0 ? (
              <p className="text-sm text-text-muted">{say('common.noAlbumWasFoundForIt')}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {found.data.map((album) => (
                  <li key={album.id}>
                    <AskableMusicTile
                      title={album}
                      onAsk={(asking) => {
                        onClose();
                        go({ asking });
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </DialogContent>

          <DialogFooter dismiss={{ onChoose: onClose }} />
        </>
      )}
    </Dialog>
  );
};

MissingSongDialog.displayName = 'MissingSongDialog';

export { MissingSongDialog };
