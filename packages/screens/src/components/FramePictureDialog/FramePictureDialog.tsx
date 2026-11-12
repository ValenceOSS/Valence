import { useEffect, useState } from 'react';
import { RotateCcw as ResetIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { PictureFramer } from '@ValenceUI/PictureFramer';
import { Slider } from '@ValenceUI/Slider';
import { MOST_FRAME_ZOOM } from '@ValenceContracts/constants/MOST_FRAME_ZOOM';
import { useFileAddress } from '@ValenceScreens/pictures/useFileAddress';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import type { FramePictureDialogProps } from './FramePictureDialog.types';
import { say } from '@ValenceI18n/say';

const UNFRAMED: PhotoFrame = { zoom: 1, x: 0, y: 0 };

/**
 * Opens once a picture is chosen for an upload, to drag it into the shape it is shown in and draw it
 * nearer before it is sent, so the server keeps the part that was chosen.
 *
 * @param file - The picture chosen, which opens this, or nothing while none is.
 * @param aspect - How wide the shape is for its height.
 * @param shape - Whether it is shown in a circle or a rounded box.
 * @param onClose - Told it was closed without the picture being used.
 * @param onUse - Told to send the picture, with where it sits.
 */
const FramePictureDialog = ({
  file,
  aspect,
  shape = 'rounded',
  onClose,
  onUse,
}: FramePictureDialogProps) => {
  const address = useFileAddress(file);
  const [frame, setFrame] = useState<PhotoFrame>(UNFRAMED);

  useEffect(() => {
    setFrame(UNFRAMED);
  }, [file]);

  return (
    <Dialog label={say('common.framePicture')} isOpen={file !== null} onClose={onClose}>
      <DialogTitle
        title={say('common.framePicture')}
        detail={say('common.chooseWhatShows')}
        size="compact"
      />

      <DialogContent>
        <div className="flex flex-col items-center gap-6">
          {address === null ? null : (
            <PictureFramer
              src={address}
              frame={frame}
              aspect={aspect}
              mostZoom={MOST_FRAME_ZOOM}
              label={say('common.wherePictureSits')}
              shape={shape}
              onFrame={setFrame}
              className={aspect >= 1 ? 'w-full max-w-md' : 'h-80 max-h-[50vh]'}
            />
          )}

          <p className="text-xs text-text-muted">{say('common.dragToMoveScrollToZoom')}</p>

          <div className="flex w-full max-w-md items-end gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs text-text">{say('common.zoom')}</span>
              <Slider
                label={say('common.zoom')}
                value={Math.round((frame.zoom - 1) * 100)}
                max={(MOST_FRAME_ZOOM - 1) * 100}
                valueLabel={(at) => `${(1 + at / 100).toFixed(2)}×`}
                onValueChange={(at) => {
                  setFrame({ ...frame, zoom: 1 + at / 100 });
                }}
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrame(UNFRAMED);
              }}
            >
              <Icon of={ResetIcon} size={15} />
              {say('common.resetPosition')}
            </Button>
          </div>
        </div>
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('screens.faceEditor.useThisFace'),
          isDisabled: file === null,
          onChoose: () => {
            if (file !== null) {
              onUse(file, frame);
            }
          },
        }}
      />
    </Dialog>
  );
};

FramePictureDialog.displayName = 'FramePictureDialog';

export { FramePictureDialog };
