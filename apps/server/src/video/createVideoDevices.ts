import { createDeviceRegistry } from '@ValenceServer/devices/createDeviceRegistry';
import type {
  VideoCommand,
  VideoDevice,
  VideoNowWatching,
} from '@ValenceContracts/schemas/VideoRemote';
import type { DeviceOwner } from '@ValenceServer/devices/createDeviceRegistry';
import type { PresenceService } from '@ValenceServer/presence/PresenceService';

type VideoDevicesOptions = {
  presence: Pick<PresenceService, 'list' | 'tell' | 'watch'>;
  onChanged?: (accountId: string) => void;
};

type VideoDevices = {
  list: (owner: DeviceOwner) => VideoDevice[];
  report: (owner: DeviceOwner, clientId: string, nowWatching: VideoNowWatching | null) => boolean;
  command: (
    owner: DeviceOwner,
    fromClientId: string,
    toClientId: string,
    command: VideoCommand,
  ) => boolean;
};

/**
 * Every open copy of Valence one person has, what kind of device each is, and what each is
 * watching — the list a film is sent to another device from, a television most often, and what a
 * phone shows while it is the remote for one. Which devices are whose, and what each last said, is
 * the shared device registry's; this adds what a film's report and a film command are.
 *
 * @param options - Presence, and who to tell when a person's devices change.
 * @returns The registry.
 */
const createVideoDevices = ({ presence, onChanged }: VideoDevicesOptions): VideoDevices => {
  const devices = createDeviceRegistry<VideoNowWatching>({
    presence,
    ...(onChanged === undefined ? {} : { onChanged }),
  });

  return {
    list: (owner) =>
      devices.owned(owner).map((entry) => ({
        clientId: entry.clientId,
        label: entry.deviceLabel,
        kind: entry.clientKind,
        nowWatching: devices.reportOf(entry.clientId),
      })),

    report: devices.report,

    command: (owner, fromClientId, toClientId, command) =>
      devices.tell(owner, fromClientId, toClientId, (fromLabel) => ({
        kind: 'video',
        command,
        fromClientId,
        fromLabel,
      })),
  };
};

export type { VideoDevices };

export { createVideoDevices };
