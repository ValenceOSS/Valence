import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { EmbeddedVideo } from '@ValenceUI/EmbeddedVideo';
import { catalogueTrailerUrl } from '@ValenceScreens/library/catalogueTrailerUrl';
import { setMusicVideo, useMusicVideo } from '@ValenceScreens/music/musicVideo';

/**
 * The music video a menu in the music section asked for, played the way a film's trailer is: in a
 * frame from the video host, over the page, with the host's own controls.
 */
const MusicVideoDialog = () => {
  const video = useMusicVideo();

  return (
    <Dialog
      label={video === null ? 'Music video' : `${video.title}, the video`}
      isOpen={video !== null}
      className="sm:w-[min(64rem,94vw)]"
      onClose={() => {
        setMusicVideo(null);
      }}
    >
      <DialogContent className="p-0">
        {video === null ? null : (
          <EmbeddedVideo
            label={`${video.title}, the video`}
            src={catalogueTrailerUrl(video.videoKey)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

MusicVideoDialog.displayName = 'MusicVideoDialog';

export { MusicVideoDialog };
