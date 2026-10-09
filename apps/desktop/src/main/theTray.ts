import { join } from 'node:path';
import { Menu, Tray, app, nativeImage } from 'electron';
import { say } from '@ValenceI18n/say';

const SIZE = 16;

const SCALES = [1, 1.5, 2];

/**
 * Puts Valence in the tray on Windows and Linux, with the way to check for a release there.
 *
 * Neither has a menu bar to show: the window draws its own bar in place of the system's, so the one
 * menu a Mac keeps in the top of the screen has nowhere to go. The tray is where a Windows
 * application keeps what belongs to the application rather than to what it is showing. It is there
 * while Valence is open and goes with it, since closing the window quits.
 *
 * The icon is drawn at each scale a display may ask for, so it stays sharp on a high-resolution
 * screen rather than being shrunk from the full-size icon by the system.
 *
 * @param checkForUpdates - What to do when somebody asks for a release now.
 * @param platform - Which system this is.
 * @returns The tray, to be kept for as long as it should show, or null on a Mac.
 */
const theTray = (
  checkForUpdates: () => void,
  platform: NodeJS.Platform = process.platform,
): Tray | null => {
  if (platform === 'darwin') {
    return null;
  }

  const whole = nativeImage.createFromPath(join(app.getAppPath(), 'build/icon.png'));
  const picture = nativeImage.createEmpty();

  for (const scale of SCALES) {
    picture.addRepresentation({
      scaleFactor: scale,
      buffer: whole.resize({ width: SIZE * scale, height: SIZE * scale, quality: 'best' }).toPNG(),
    });
  }

  const tray = new Tray(picture);

  tray.setToolTip(say('common.valence'));
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: say('common.checkForUpdates'), click: checkForUpdates },
      { type: 'separator' },
      { role: 'quit' },
    ]),
  );

  return tray;
};

export { theTray };
