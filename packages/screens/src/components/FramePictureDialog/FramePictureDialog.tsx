import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, RotateCcw as ResetIcon } from '@keyline-icons/react';
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
import { isUnframed } from '@ValenceCore/pictures/isUnframed';
import { readPickedPicture } from '@ValenceScreens/pictures/readPickedPicture';
import { notify } from '@ValenceUI/notify';
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
 * @param limits - How large a picture of this kind may be: one larger is turned away before this
 *   opens, with why.
 * @param shape - Whether it is shown in a circle or a rounded box.
 * @param onClose - Told it was closed without the picture being used.
 * @param onUse - Told to send the picture, with where it sits.
 */
const FramePictureDialog = ({
  file,
  aspect,
  limits,
  shape = 'rounded',
  onClose,
  onUse,
}: FramePictureDialogProps) => {
  const [read, setRead] = useState<{ picture: File; preview: File } | null>(null);
  const address = useFileAddress(read?.preview ?? null);
  const [frame, setFrame] = useState<PhotoFrame>(UNFRAMED);
  const latest = useRef({ limits, onClose });

  useEffect(() => {
    latest.current = { limits, onClose };
  });

  useEffect(() => {
    setFrame(UNFRAMED);
    setRead(null);

    if (file === null) {
      return;
    }

    let isCurrent = true;

    void readPickedPicture(file, latest.current.limits).then((checked) => {
      if (!isCurrent) {
        return;
      }

      if ('refusal' in checked) {
        notify.failed(checked.refusal);
        latest.current.onClose();

        return;
      }

      setRead(checked);
    });

    return () => {
      isCurrent = false;
    };
  }, [file]);

  return (
    <Dialog
      label={say('common.framePicture')}
      isOpen={read !== null}
      onClose={onClose}
      className="sm:w-[min(26rem,92vw)]"
    >
      <DialogTitle
        title={say('common.framePicture')}
        detail={say('common.chooseWhatShows')}
        size="compact"
      />

      <DialogContent>
        <div className="flex flex-col gap-3">
          {address === null ? null : (
            <PictureFramer
              src={address}
              frame={frame}
              aspect={aspect}
              mostZoom={MOST_FRAME_ZOOM}
              label={say('common.wherePictureSits')}
              shape={shape}
              onFrame={setFrame}
              className="h-60 w-full"
            />
          )}

          <div className="flex items-center gap-3">
            <Icon of={ImageIcon} size={13} tone="muted" />
            <div className="min-w-0 flex-1">
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
            <Icon of={ImageIcon} size={19} tone="muted" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">{say('common.dragToMovePinchToZoom')}</p>
            <Button
              variant="ghost"
              size="sm"
              disabled={isUnframed(frame)}
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
          isDisabled: read === null,
          onChoose: () => {
            if (read !== null) {
              onUse(read.picture, frame);
            }
          },
        }}
      />
    </Dialog>
  );
};

FramePictureDialog.displayName = 'FramePictureDialog';

export { FramePictureDialog };
