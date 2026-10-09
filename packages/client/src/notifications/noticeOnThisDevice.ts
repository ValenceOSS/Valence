import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { areDeviceNoticesOn } from '@ValenceClient/notifications/deviceNotices';
import type { LocalNotice } from '@ValenceClient/platform/Platform.types';

/**
 * Puts a notice up on this device's own screen, where somebody has turned that on.
 *
 * @param notice - What happened, and what to do once somebody presses it.
 */
const noticeOnThisDevice = (notice: LocalNotice): void => {
  if (areDeviceNoticesOn()) {
    platformInUse().notifyLocally(notice);
  }
};

export { noticeOnThisDevice };
